import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { calculateMasteryLevel } from '../utils/helpers';
import { Prisma } from '@prisma/client';

const router = Router();

router.get('/gaps', async (req, res) => {
  try {
    const { studentId, category } = req.query;

    const where: Prisma.GapWhereInput = {};
    if (studentId) where.studentId = String(studentId);
    if (category) where.category = String(category);

    const gaps = await prisma.gap.findMany({
      where,
      include: {
        student: true,
        _count: {
          select: {
            sessions: {
              where: {
                score: { lt: 60 }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedGaps = gaps.map(gap => ({
      id: gap.id,
      conceptName: gap.description.split(' ').slice(0, 3).join(' '),
      category: gap.category,
      masteryLevel: calculateMasteryLevel(gap.level, gap._count.sessions),
      recentFailures: gap._count.sessions,
      level: gap.level,
      description: gap.description
    }));

    return res.json(transformedGaps);
  } catch (error) {
    console.error('Failed to get gaps', error);
    return res.status(500).json({ error: 'Failed to get gaps' });
  }
});

export default router;
