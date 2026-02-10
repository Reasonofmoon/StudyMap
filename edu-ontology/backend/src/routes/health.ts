import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { initKnowledgeGraph } from '../db/neo4j';

const prisma = new PrismaClient();
const router = Router();

// Health check endpoint
router.get('/status', async (req, res) => {
  try {
    // Check Prisma
    const prismaStatus = await prisma.$queryRaw`SELECT 1`;

    // Check Neo4j (non-blocking check)
    let neo4jStatus = 'unknown';
    try {
      await initKnowledgeGraph();
      neo4jStatus = 'healthy';
    } catch (neo4jError) {
      neo4jStatus = 'degraded';
      console.warn('Neo4j health check failed:', neo4jError);
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        prisma: 'healthy',
        neo4j: neo4jStatus,
        environment: process.env.NODE_ENV
      },
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// Detailed health check (with timing)
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();

  try {
    const dbStart = Date.now();
    const prismaStatus = await prisma.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - dbStart;

    const neo4jStart = Date.now();
    let neo4jTime = 0;
    let neo4jStatus = 'healthy';
    try {
      await initKnowledgeGraph();
      neo4jTime = Date.now() - neo4jStart;
    } catch (neo4jError) {
      neo4jStatus = 'degraded';
      neo4jTime = Date.now() - neo4jStart;
      console.warn('Neo4j health check failed:', neo4jError);
    }

    const totalTime = Date.now() - startTime;

    res.json({
      status: 'healthy',
      responseTime: totalTime,
      components: {
        database: {
          status: 'healthy',
          responseTime: dbTime
        },
        neo4j: {
          status: neo4jStatus,
          responseTime: neo4jTime
        }
      },
      totalMemory: process.memoryUsage().heapTotal,
      usedMemory: process.memoryUsage().heapUsed,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Check critical services
    await prisma.$queryRaw`SELECT 1`;
    await initKnowledgeGraph();

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: 'Service not ready'
    });
  }
});

export { router as healthRouter };