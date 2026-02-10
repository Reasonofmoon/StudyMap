import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';

// Load environment variables from `.env` for local development.
dotenv.config();

// Import services
import { assignmentService } from './services/assignment.service';
import { aiService } from './utils/ai/ai-assignment-generator';

// Initialize environment variables
const env = {
  ENGINE_PORT: process.env['ENGINE_PORT'] || process.env['PORT'] || '3001',
  NODE_ENV: process.env['NODE_ENV'] || 'development',
};

// Initialize Express app
const app = express();
const port = env.ENGINE_PORT;

// Middleware setup
app.use(helmet()); // Security headers
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // JSON parsing
app.use(express.urlencoded({ extended: true })); // URL-encoded parsing

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    await prisma.$executeRaw`SELECT 1`;
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

// API Routes

// Assignment routes
app.post('/engine/assignments', async (req, res) => {
  try {
    const { studentId, gapIds } = req.body;

    if (!studentId || !gapIds || !Array.isArray(gapIds)) {
      return res.status(400).json({
        error: 'studentId and gapIds array are required'
      });
    }

    const assignment = await assignmentService.createAssignmentFromGaps(studentId, gapIds);
    return res.json(assignment);
  } catch (error) {
    console.error('Assignment creation failed:', error);
    return res.status(500).json({
      error: 'Failed to create assignment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/engine/students/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;
    const assignments = await assignmentService.getStudentAssignments(id);

    return res.json(assignments);
  } catch (error) {
    console.error('Failed to get student assignments', error);
    return res.status(500).json({
      error: 'Failed to get assignments'
    });
  }
});

app.post('/engine/sessions/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: 'answers array is required'
      });
    }

    const result = await assignmentService.submitSessionAnswers(id, answers);
    return res.json(result);
  } catch (error) {
    console.error('Session submission failed', error);
    return res.status(500).json({
      error: 'Failed to submit session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Gap analysis routes
app.get('/engine/gaps', async (req, res) => {
  try {
    const { studentId, category } = req.query;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (category) where.category = category;

    const gaps = await prisma.gap.findMany({
      where,
      include: {
        student: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(gaps);
  } catch (error) {
    console.error('Failed to get gaps', error);
    return res.status(500).json({ error: 'Failed to get gaps' });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error', error);

  if (env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      requestId: generateRequestId()
    });
  } else {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Generate request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

export { app, prisma };
