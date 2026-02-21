import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { getWeekStart } from '../utils/helpers';

const router = Router();

router.get('/trends', async (req, res) => {
  try {
    const { studentId } = req.query;
    
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const sessions = await prisma.learningSession.findMany({
      where: {
        studentId: String(studentId),
        startTime: { gte: eightWeeksAgo },
        score: { not: null }
      },
      orderBy: { startTime: 'asc' }
    });

    const weeklyScores: Record<string, number[]> = {};
    
    sessions.forEach(session => {
      const weekStart = getWeekStart(session.startTime);
      if (!weeklyScores[weekStart]) {
        weeklyScores[weekStart] = [];
      }
      weeklyScores[weekStart].push(session.score || 0);
    });

    const trendData = Object.entries(weeklyScores)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, scores]) => ({
        week,
        avgMastery: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        sessionCount: scores.length
      }));

    return res.json(trendData);
  } catch (error) {
    console.error('Failed to get trends', error);
    return res.status(500).json({ error: 'Failed to get trends' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { studentId } = req.query;
    
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const student = await prisma.student.findUnique({
      where: { id: String(studentId) },
      include: {
        gaps: true,
        sessions: true,
        assignments: {
          include: {
            sessions: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const totalSessions = student.sessions.length;
    const completedSessions = student.sessions.filter(s => s.score !== null).length;
    const avgScore = completedSessions > 0
      ? Math.round(student.sessions.reduce((acc, s) => acc + (s.score || 0), 0) / completedSessions)
      : 0;
    const criticalGaps = student.gaps.length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const lastWeekSessions = student.sessions.filter(s => 
      s.startTime >= oneWeekAgo && s.score !== null
    );
    const prevWeekSessions = student.sessions.filter(s => 
      s.startTime >= twoWeeksAgo && s.startTime < oneWeekAgo && s.score !== null
    );

    const lastWeekAvg = lastWeekSessions.length > 0
      ? lastWeekSessions.reduce((acc, s) => acc + (s.score || 0), 0) / lastWeekSessions.length
      : 0;
    const prevWeekAvg = prevWeekSessions.length > 0
      ? prevWeekSessions.reduce((acc, s) => acc + (s.score || 0), 0) / prevWeekSessions.length
      : 0;

    const weeklyDelta = Math.round(lastWeekAvg - prevWeekAvg);

    return res.json({
      avgMastery: avgScore,
      criticalGaps,
      weeklyDelta,
      totalSessions,
      completedSessions
    });
  } catch (error) {
    console.error('Failed to get stats', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
