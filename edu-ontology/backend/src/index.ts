import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import { assignmentRouter } from './routes/assignments';
import { studentRouter } from './routes/students';
import { healthRouter } from './routes/health';

// Import utilities
import { env } from '../shared/config/env';
import { handleApiError } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
  max: env.rateLimitMaxRequests || 100,
  message: {
    error: 'Too many requests from this IP'
  }
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/students', studentRouter);

// Error handling
app.use(handleApiError);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EduOntology Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

export default app;