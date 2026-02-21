import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { assignmentService } from '../services/assignment.service';

const router = Router();

router.post('/assignments', async (req, res) => {
  try {
    const { studentId, gapIds } = req.body;

    if (!studentId || !gapIds || !Array.isArray(gapIds)) {
      return res.status(400).json({
        error: 'studentId and gapIds array are required'
      });
    }

    const assignment = await assignmentService.createAssignmentFromGaps(studentId, gapIds);
    return res.json(assignment);
  } catch (error) {
    console.error('Assignment creation failed:', error);
    return res.status(500).json({
      error: 'Failed to create assignment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/students/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;
    const assignments = await assignmentService.getStudentAssignments(id);

    return res.json(assignments);
  } catch (error) {
    console.error('Failed to get student assignments', error);
    return res.status(500).json({
      error: 'Failed to get assignments'
    });
  }
});

router.get('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        assignmentQuestions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        },
        student: true
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const transformedAssignment = {
      id: assignment.id,
      name: assignment.name,
      description: assignment.description,
      studentId: assignment.studentId,
      studentName: assignment.student.name,
      createdAt: assignment.createdAt,
      questions: assignment.assignmentQuestions.map(aq => ({
        id: aq.question.id,
        type: aq.question.type,
        content: aq.question.content,
        options: aq.question.options ? JSON.parse(aq.question.options) : null,
        answer: aq.question.answer,
        explanation: aq.question.explanation,
        difficulty: aq.question.difficulty,
        order: aq.order
      }))
    };

    return res.json(transformedAssignment);
  } catch (error) {
    console.error('Failed to get assignment', error);
    return res.status(500).json({ error: 'Failed to get assignment' });
  }
});

export default router;
