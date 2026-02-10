import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ValidationError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const router = Router();

// Create a new student
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, level, gapData } = req.body;

    // Validate required fields
    if (!email || !level) {
      throw new ValidationError('Email and level are required');
    }

    // Validate level format
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(level)) {
      throw new ValidationError('Invalid level. Must be one of: A1, A2, B1, B2, C1, C2');
    }

    const student = await prisma.student.create({
      data: {
        email,
        level,
        gapData: gapData || {}
      },
      select: {
        id: true,
        email: true,
        level: true,
        gapData: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

// Get student by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            assignments: true,
            attempts: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

// Update student gap data
router.patch('/:id/gap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { gapData } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        gapData: gapData
      }
    });

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

// Get student statistics
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stats = await prisma.learningProgress.groupBy({
      by: ['assignmentType'],
      _count: {
        id: true
      },
      _avg: {
        averageScore: true
      },
      _max: {
        lastAttemptedAt: true
      },
      where: {
        studentId: id
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    const totalProgress = await prisma.learningProgress.findFirst({
      where: { studentId: id }
    });

    res.json({
      success: true,
      data: {
        byType: stats,
        overall: totalProgress,
        completedAssignments: await prisma.assignment.count({
          where: {
            studentId: id,
            status: 'completed'
          }
        })
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as studentRouter };