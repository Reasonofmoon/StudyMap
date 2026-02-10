import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateAssignment, batchGenerateAssignments } from '../ai/claude';
import { adaptForLevel } from '../ai/levelAdapter';
import { AssignmentType, GapData, Assignment } from '../ai/types';
import { ApiError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const router = Router();

// Generate a single assignment
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, type } = req.body;

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new ApiError('Student not found', false, 'STUDENT_NOT_FOUND');
    }

    const gapData = student.gapData as GapData || {
      vocabulary: [],
      grammar: [],
      totalWords: 100,
      mastered: 0
    };

    // Generate assignment with Claude
    let assignment = await generateAssignment({
      studentLevel: student.level,
      gapData,
      type: type as AssignmentType
    });

    // Apply level adaptation
    assignment = adaptForLevel(assignment, student.level);

    // Save to database
    const savedAssignment = await prisma.assignment.create({
      data: {
        studentId,
        type: assignment.type,
        content: assignment.content,
        difficulty: assignment.difficulty,
        metadata: assignment.metadata
      }
    });

    // Convert to response format
    const response = {
      ...assignment,
      id: savedAssignment.id,
      studentId,
      status: savedAssignment.status,
      createdAt: savedAssignment.createdAt
    };

    res.status(201).json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

// Generate multiple assignments at once
router.post('/batch-generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, types } = req.body;

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new ApiError('Student not found', false, 'STUDENT_NOT_FOUND');
    }

    const gapData = student.gapData as GapData || {
      vocabulary: [],
      grammar: [],
      totalWords: 100,
      mastered: 0
    };

    // Generate all assignments in parallel
    const assignments = await batchGenerateAssignments({
      studentLevel: student.level,
      gapData,
      types: types as AssignmentType[]
    });

    // Apply level adaptation and save
    const savedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const adapted = adaptForLevel(assignment, student.level);

        const saved = await prisma.assignment.create({
          data: {
            studentId,
            type: adapted.type,
            content: adapted.content,
            difficulty: adapted.difficulty,
            metadata: adapted.metadata
          }
        });

        return {
          ...adapted,
          id: saved.id,
          studentId,
          status: saved.status,
          createdAt: saved.createdAt
        };
      })
    );

    res.status(201).json({
      success: true,
      data: savedAssignments
    });
  } catch (error) {
    next(error);
  }
});

// Get student's assignments
router.get('/student/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const { type, status, limit = 20 } = req.query;

    const where: any = { studentId };
    if (type) where.type = type;
    if (status) where.status = status;

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
});

// Get assignment by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            level: true,
            email: true
          }
        },
        attempts: {
          orderBy: { completedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!assignment) {
      throw new ApiError('Assignment not found', false, 'ASSIGNMENT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
});

// Submit an attempt
router.post('/:id/attempt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { answer, timeTaken } = req.body;

    const assignment = await prisma.assignment.findUnique({
      where: { id }
    });

    if (!assignment) {
      throw new ApiError('Assignment not found', false, 'ASSIGNMENT_NOT_FOUND');
    }

    // Check if answer is correct
    const correctAnswer = assignment.content.answer;
    const isCorrect = Array.isArray(correctAnswer)
      ? correctAnswer.includes(answer)
      : correctAnswer === answer;

    // Calculate score (simple implementation)
    const score = isCorrect ? 100 : calculatePartialScore(answer, correctAnswer);

    // Save attempt
    const attempt = await prisma.assignmentAttempt.create({
      data: {
        assignmentId: id,
        studentId: assignment.studentId,
        answer,
        score,
        timeTaken,
        feedback: {
          isCorrect,
          correctAnswer,
          score
        }
      }
    });

    // Update assignment status if this was the first correct attempt
    if (isCorrect && assignment.status !== 'completed') {
      await prisma.assignment.update({
        where: { id },
        data: { status: 'completed' }
      });
    }

    // Update learning progress
    await updateLearningProgress(assignment.studentId, assignment.type, score);

    res.json({
      success: true,
      data: {
        ...attempt,
        isCorrect
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate partial score
function calculatePartialScore(answer: string, correctAnswer: string | string[]): number {
  // Simple implementation: partial credit for partially correct answers
  if (Array.isArray(correctAnswer)) {
    const maxSimilarity = Math.max(...correctAnswer.map(correct =>
      calculateStringSimilarity(answer, correct)
    ));
    return Math.round(maxSimilarity * 100);
  }

  return calculateStringSimilarity(answer, correctAnswer) * 100;
}

// Helper function to calculate string similarity
function calculateStringSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Helper function for Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// Helper function to update learning progress
async function updateLearningProgress(studentId: string, assignmentType: string, score: number) {
  const progress = await prisma.learningProgress.upsert({
    where: {
      studentId_assignmentType: {
        studentId,
        assignmentType
      }
    },
    update: {
      totalAttempts: { increment: 1 },
      correctAnswers: score >= 70 ? { increment: 1 } : undefined,
      averageScore: { set: Math.floor((score + await getCurrentAverage(studentId, assignmentType)) / 2) },
      lastAttemptedAt: new Date()
    },
    create: {
      studentId,
      level: (await prisma.student.findUnique({ where: { id: studentId } }))?.level || 'A1',
      assignmentType,
      totalAttempts: 1,
      correctAnswers: score >= 70 ? 1 : 0,
      averageScore: score,
      lastAttemptedAt: new Date()
    }
  });
}

async function getCurrentAverage(studentId: string, assignmentType: string): Promise<number> {
  const existing = await prisma.learningProgress.findUnique({
    where: {
      studentId_assignmentType: {
        studentId,
        assignmentType
      }
    }
  });
  return existing?.averageScore || 0;
}

export { router as assignmentRouter };