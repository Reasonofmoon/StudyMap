import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { assignmentService } from '../services/assignment.service';
import { Prisma } from '@prisma/client';

const router = Router();

router.post('/sessions/start', async (req, res) => {
  try {
    const { studentId, assignmentId } = req.body;

    if (!studentId || !assignmentId) {
      return res.status(400).json({
        error: 'studentId and assignmentId are required'
      });
    }

    const session = await assignmentService.startSession(studentId, assignmentId);
    return res.json(session);
  } catch (error) {
    console.error('Failed to start session', error);
    return res.status(500).json({ error: 'Failed to start session' });
  }
});

router.post('/sessions/:id/submit', async (req, res) => {
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

router.get('/sessions', async (req, res) => {
  try {
    const { studentId, limit } = req.query;
    
    const where: Prisma.LearningSessionWhereInput = {};
    if (studentId) where.studentId = String(studentId);

    const sessions = await prisma.learningSession.findMany({
      where,
      include: {
        assignment: {
          include: {
            assignmentQuestions: { select: { id: true } }
          }
        },
        gap: true,
        _count: { select: { sessionQuestions: true } },
        sessionQuestions: { select: { isCorrect: true } }
      },
      orderBy: { startTime: 'desc' },
      take: limit ? parseInt(String(limit)) : 20
    });

    const transformedSessions = sessions.map(session => {
      // Use sessionQuestions if available (submitted), otherwise fallback to assignmentQuestions
      const hasSubmittedAnswers = session.sessionQuestions && session.sessionQuestions.length > 0;
      const assignmentQuestionCount = session.assignment?.assignmentQuestions?.length || 0;
      
      const questionsTotal = hasSubmittedAnswers 
        ? session.sessionQuestions.length 
        : assignmentQuestionCount;
      
      const questionsCorrect = hasSubmittedAnswers
        ? session.sessionQuestions.filter(sq => sq.isCorrect).length
        : 0; // Can't have correct answers before submission
      
      return {
        id: session.id,
        name: session.assignment?.name || session.gap?.description || 'Practice Session',
        date: session.startTime.toISOString(),
        score: session.score || 0,
        durationMin: session.duration || 0,
        questionsTotal,
        questionsCorrect,
        endTime: session.endTime?.toISOString() || null
      };
    });

    return res.json(transformedSessions);
  } catch (error) {
    console.error('Failed to get sessions', error);
    return res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.learningSession.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            assignmentQuestions: {
              include: { question: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        sessionQuestions: true,
        student: true,
        gap: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json(session);
  } catch (error) {
    console.error('Failed to get session', error);
    return res.status(500).json({ error: 'Failed to get session' });
  }
});

export default router;
