import { prisma } from '../../lib/prisma';

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

      // MVP: create questions first, then connect them via AssignmentQuestion.
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
    const session = await prisma.learningSession.create({
      data: {
        studentId,
        assignmentId
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
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const assignmentQuestions = session.assignment?.assignmentQuestions || [];

    // Process each answer
    const sessionQuestions = await Promise.all(
      questionAnswers.map(async ({ questionId, answer, timeTaken }) => {
        const question = assignmentQuestions.find(aq => aq.questionId === questionId);
        if (!question) {
          throw new Error(`Question ${questionId} not found in assignment`);
        }

        // Check if answer is correct
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

    // Calculate final score
    const correctCount = sessionQuestions.filter(sq => sq.isCorrect).length;
    const totalCount = sessionQuestions.length;
    const score = Math.round((correctCount / totalCount) * 100);

    // Update session with results
    const updatedSession = await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        score,
        duration: Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000)
      }
    });

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
   * Generate personalized feedback for a question
   */
  private generateFeedback(question: any, isCorrect: boolean): string {
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
  private calculateProgress(assignment: any) {
    const totalQuestions = assignment._count.assignmentQuestions;
    const completedSessions = assignment.sessions.length;
    const averageScore = assignment.sessions.length > 0
      ? assignment.sessions.reduce((acc: number, s: any) => acc + (s.score || 0), 0) / completedSessions
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
