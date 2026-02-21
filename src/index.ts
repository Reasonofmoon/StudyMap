import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';

dotenv.config();

import assignmentsRouter from './routes/assignments';
import sessionsRouter from './routes/sessions';
import gapsRouter from './routes/gaps';
import trendsRouter from './routes/trends';
import { generateRequestId } from './utils/helpers';

const env = {
  ENGINE_PORT: process.env['ENGINE_PORT'] || process.env['PORT'] || '3001',
  NODE_ENV: process.env['NODE_ENV'] || 'development',
};

const app = express();
const port = env.ENGINE_PORT;

app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? ['https://yourdomain.com', 'https://connectedu-3.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (_req, res) => {
  try {
    // SQLite: use $queryRawUnsafe for SELECT (returns results)
    await prisma.$queryRawUnsafe('SELECT 1 AS ok');
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      note: 'Neo4j is optional — graph features degrade gracefully when unavailable'
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

app.use('/engine', assignmentsRouter);
app.use('/engine', sessionsRouter);
app.use('/engine', gapsRouter);
app.use('/engine', trendsRouter);

app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

export { app, prisma };
