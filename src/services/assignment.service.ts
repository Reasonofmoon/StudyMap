import { prisma } from '../../lib/prisma';
import { neo4j, Neo4jParams } from '../../lib/neo4j/driver';
import { Prisma, LearningSession, SessionQuestion, AssignmentQuestion, Question } from '@prisma/client';

export class AssignmentService {
  /**
   * Create a new assignment based on student's gaps
   */
  async createAssignmentFromGaps(studentId: string, gapIds: string[]) {
    try {
      if (!gapIds.length) {
        throw new Error('gapIds must contain at least one id');
      }
      const gapId = gapIds[0]!;
      if (!gapId) {
        throw new Error('gapIds[0] is required');
      }

      const [q1, q2] = await prisma.$transaction([
        prisma.question.create({
          data: {
            type: 'multiple_choice',
            content: 'What is the capital of France?',
            options: JSON.stringify(['Paris', 'London', 'Berlin', 'Madrid']),
            answer: 'Paris',
            explanation: 'Paris is the capital of France',
            difficulty: 3,
            metadata: JSON.stringify({}),
            gapId,
          },
        }),
        prisma.question.create({
          data: {
            type: 'fill_blank',
            content: 'The largest planet in our solar system is ____.',
            options: null,
            answer: 'Jupiter',
            explanation: 'Jupiter is the largest planet in our solar system',
            difficulty: 4,
            metadata: JSON.stringify({}),
            gapId,
          },
        }),
      ])

      const assignment = await prisma.assignment.create({
        data: {
          name: 'Sample Assignment',
          description: 'Generated from learning gaps',
          metadata: JSON.stringify({ gapIds }),
          studentId,
          assignmentQuestions: {
            create: [
              { order: 1, questionId: q1.id },
              { order: 2, questionId: q2.id },
            ],
          },
        },
        include: {
          assignmentQuestions: {
            include: { question: true },
            orderBy: { order: 'asc' },
          },
        },
      })

      return assignment;
    } catch (error) {
      console.error('Assignment creation failed:', error);
      throw new Error('Failed to create assignment from gaps');
    }
  }

  /**
   * Start a learning session for an assignment
   */
  async startSession(studentId: string, assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        assignmentQuestions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    const gapId = assignment?.assignmentQuestions[0]?.question?.gapId ?? null;

    const session = await prisma.learningSession.create({
      data: {
        studentId,
        assignmentId,
        gapId
      }
    });

    return session;
  }

  /**
   * Submit answers for a session
   */
  async submitSessionAnswers(
    sessionId: string,
    questionAnswers: Array<{
      questionId: string;
      answer: string;
      timeTaken: number;
    }>
  ) {
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        assignment: {
          include: {
            assignmentQuestions: {
              include: { question: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        student: true,
        gap: true,
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const assignmentQuestions = session.assignment?.assignmentQuestions || [];

    const sessionQuestions = await Promise.all(
      questionAnswers.map(async ({ questionId, answer, timeTaken }) => {
        const question = assignmentQuestions.find(aq => aq.questionId === questionId);
        if (!question) {
          throw new Error(`Question ${questionId} not found in assignment`);
        }

        const isCorrect = answer.toLowerCase().trim() === (question.question.answer?.toLowerCase().trim());

        return prisma.sessionQuestion.create({
          data: {
            sessionId,
            questionId,
            answer,
            isCorrect,
            timeTaken,
            feedback: this.generateFeedback(question.question, isCorrect)
          }
        });
      })
    );

    const correctCount = sessionQuestions.filter(sq => sq.isCorrect).length;
    const totalCount = sessionQuestions.length;
    const score = Math.round((correctCount / totalCount) * 100);

    const updatedSession = await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        score,
        duration: Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000)
      }
    });

    await this.updateKnowledgeGraph(session, sessionQuestions, assignmentQuestions);

    return {
      session: updatedSession,
      sessionQuestions,
      performance: {
        total: totalCount,
        correct: correctCount,
        incorrect: totalCount - correctCount,
        score
      }
    };
  }

  /**
   * Update Neo4j Knowledge Graph with session results
   */
  private async updateKnowledgeGraph(
    session: LearningSession & { student?: { name: string } | null; gap?: { description: string } | null },
    sessionQuestions: SessionQuestion[],
    assignmentQuestions: AssignmentQuestion[]
  ) {
    try {
      const studentId = session.studentId;
      const gapId = session.gapId;
      const isCorrect = sessionQuestions.some((sq) => sq.isCorrect);
      const masteryChange = isCorrect ? 0.1 : -0.15;

      if (!gapId) {
        console.log('[Neo4j Sync] No gap associated with session, skipping graph update');
        return;
      }

      const checkQuery = `
        MATCH (s:Student {id: $studentId})
        MATCH (c:Concept {id: $gapId})
        RETURN s, c
      `;

      const existing = await neo4j.read(checkQuery, { studentId, gapId } as unknown as Neo4jParams);

      if (existing.records.length === 0) {
        const createQuery = `
          MERGE (s:Student {id: $studentId})
          SET s.name = $studentName
          MERGE (c:Concept {id: $gapId})
          SET c.name = $conceptName
          MERGE (s)-[r:KNOWS]->(c)
          SET r.mastery = COALESCE(r.mastery, 0.3) + $masteryChange
          RETURN s, c, r
        `;

        await neo4j.write(createQuery, {
          studentId,
          studentName: session.student?.name || 'Unknown',
          gapId,
          conceptName: session.gap?.description || 'Unknown Concept',
          masteryChange
        } as unknown as Neo4jParams);

        console.log(`[Neo4j Sync] Created student-concept relationship with mastery update`);
      } else {
        const updateQuery = `
          MATCH (s:Student {id: $studentId})-[r:KNOWS]->(c:Concept {id: $gapId})
          SET r.mastery = CASE 
            WHEN $isCorrect THEN MIN(r.mastery + 0.1, 1.0)
            ELSE MAX(r.mastery - 0.15, 0.0)
          END
          SET r.lastUpdated = datetime()
          RETURN r.mastery as newMastery
        `;

        const result = await neo4j.write(updateQuery, {
          studentId,
          gapId,
          isCorrect
        } as unknown as Neo4jParams);

        const newMastery = result.records[0]?.get('newMastery');
        console.log(`[Neo4j Sync] Updated mastery to ${newMastery}`);
      }

      await this.recordLearningEvent(session, sessionQuestions);

    } catch (graphError) {
      console.error('[Neo4j Sync] Failed to update knowledge graph:', graphError);
    }
  }

  /**
   * Record learning event in Neo4j for analytics
   */
  private async recordLearningEvent(session: LearningSession, sessionQuestions: SessionQuestion[]) {
    try {
      const eventQuery = `
        MERGE (s:Student {id: $studentId})
        MERGE (c:Concept {id: $gapId})
        CREATE (e:LearningEvent {
          id: randomUUID(),
          timestamp: datetime(),
          score: $score,
          duration: $duration,
          correctCount: $correctCount,
          totalCount: $totalCount
        })
        CREATE (s)-[:COMPLETED]->(e)
        CREATE (e)-[:TARGETS]->(c)
        RETURN e
      `;

      await neo4j.write(eventQuery, {
        studentId: session.studentId,
        gapId: session.gapId,
        score: session.score,
        duration: session.duration,
        correctCount: sessionQuestions.filter((sq) => sq.isCorrect).length,
        totalCount: sessionQuestions.length
      } as unknown as Neo4jParams);

      console.log('[Neo4j Sync] Recorded learning event');
    } catch (eventError) {
      console.error('[Neo4j Sync] Failed to record learning event:', eventError);
    }
  }

  /**
   * Get student's knowledge graph state
   */
  async getStudentKnowledgeGraph(studentId: string) {
    try {
      const query = `
        MATCH (s:Student {id: $studentId})-[r:KNOWS]->(c:Concept)
        RETURN c.id as conceptId, c.name as conceptName, r.mastery as mastery, r.lastUpdated as lastUpdated
        ORDER BY r.mastery ASC
        LIMIT 20
      `;

      const result = await neo4j.read(query, { studentId } as unknown as Neo4jParams);

      return result.records.map(record => ({
        conceptId: record.get('conceptId'),
        conceptName: record.get('conceptName'),
        mastery: record.get('mastery'),
        lastUpdated: record.get('lastUpdated')
      }));
    } catch (error) {
      console.error('[Neo4j] Failed to get knowledge graph:', error);
      return [];
    }
  }

  /**
   * Generate personalized feedback for a question
   */
  private generateFeedback(question: Question, isCorrect: boolean): string {
    if (isCorrect) {
      return 'Excellent! You answered this correctly.';
    }

    return `The correct answer is: ${question.answer}. ${question.explanation || 'Please review this topic.'}`;
  }

  /**
   * Get student's assignments with progress tracking
   */
  async getStudentAssignments(studentId: string) {
    const assignments = await prisma.assignment.findMany({
      where: { studentId },
      include: {
        _count: {
          select: {
            assignmentQuestions: true,
            sessions: true
          }
        },
        sessions: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            score: true,
            duration: true
          },
          orderBy: { startTime: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return assignments.map(assignment => ({
      ...assignment,
      progress: this.calculateProgress(assignment)
    }));
  }

  /**
   * Calculate assignment progress
   */
  private calculateProgress(
    assignment: Prisma.AssignmentGetPayload<{
      include: {
        _count: { select: { assignmentQuestions: true; sessions: true } };
        sessions: { select: { id: true; startTime: true; endTime: true; score: true; duration: true } };
      }
    }>
  ) {
    const totalQuestions = assignment._count.assignmentQuestions;
    const completedSessions = assignment.sessions.length;
    const averageScore = assignment.sessions.length > 0
      ? assignment.sessions.reduce((acc: number, s) => acc + (s.score || 0), 0) / completedSessions
      : 0;

    return {
      totalQuestions,
      completedSessions,
      averageScore,
      isCompleted: completedSessions > 0
    };
  }
}

export const assignmentService = new AssignmentService();
