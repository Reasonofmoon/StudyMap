import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.sessionQuestion.deleteMany();
  await prisma.learningSession.deleteMany();
  await prisma.assignmentQuestion.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.gap.deleteMany();
  await prisma.student.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create test student
  const student = await prisma.student.create({
    data: {
      id: 'student-001',
      name: 'Alex Chen',
      email: 'alex@connectedu.io',
    },
  });
  console.log(`✅ Created student: ${student.name}`);

  // Create learning gaps for the student
  const gaps = await Promise.all([
    prisma.gap.create({
      data: {
        id: 'gap-fractions',
        category: 'mathematics',
        level: 4,
        description: 'Understanding and operating with fractions',
        studentId: student.id,
      },
    }),
    prisma.gap.create({
      data: {
        id: 'gap-photosynthesis',
        category: 'science',
        level: 5,
        description: 'The process of photosynthesis in plants',
        studentId: student.id,
      },
    }),
    prisma.gap.create({
      data: {
        id: 'gap-subjunctive',
        category: 'grammar',
        level: 6,
        description: 'Subjunctive mood in English grammar',
        studentId: student.id,
      },
    }),
    prisma.gap.create({
      data: {
        id: 'gap-quadratic',
        category: 'mathematics',
        level: 7,
        description: 'Solving quadratic equations',
        studentId: student.id,
      },
    }),
    prisma.gap.create({
      data: {
        id: 'gap-irregular-verbs',
        category: 'vocabulary',
        level: 3,
        description: 'English irregular verbs conjugation',
        studentId: student.id,
      },
    }),
    prisma.gap.create({
      data: {
        id: 'gap-french-revolution',
        category: 'history',
        level: 5,
        description: 'Causes and effects of the French Revolution',
        studentId: student.id,
      },
    }),
  ]);
  console.log(`✅ Created ${gaps.length} learning gaps`);

  // Create questions for each gap
  const questionsData = [
    // Fractions questions
    {
      gapId: 'gap-fractions',
      questions: [
        { type: 'multiple_choice', content: 'What is 3/4 + 1/2?', options: JSON.stringify(['5/4', '4/6', '1 1/4', '2/3']), answer: '5/4', explanation: 'To add fractions, find a common denominator (4). 3/4 + 2/4 = 5/4', difficulty: 3 },
        { type: 'multiple_choice', content: 'Which fraction is equivalent to 2/3?', options: JSON.stringify(['4/6', '3/4', '5/6', '1/2']), answer: '4/6', explanation: 'Multiplying both numerator and denominator by 2 gives 4/6', difficulty: 2 },
        { type: 'fill_blank', content: 'The fraction 3/5 expressed as a decimal is ____.', answer: '0.6', explanation: '3 ÷ 5 = 0.6', difficulty: 2 },
      ],
    },
    // Photosynthesis questions
    {
      gapId: 'gap-photosynthesis',
      questions: [
        { type: 'multiple_choice', content: 'What is the primary product of photosynthesis?', options: JSON.stringify(['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen']), answer: 'Oxygen', explanation: 'Plants release oxygen as a byproduct of photosynthesis', difficulty: 2 },
        { type: 'multiple_choice', content: 'Which organelle is responsible for photosynthesis?', options: JSON.stringify(['Chloroplast', 'Mitochondria', 'Nucleus', 'Ribosome']), answer: 'Chloroplast', explanation: 'Chloroplasts contain chlorophyll that captures light energy', difficulty: 3 },
        { type: 'fill_blank', content: 'The process of photosynthesis converts light energy into ____ energy.', answer: 'chemical', explanation: 'Plants convert light energy into chemical energy stored in glucose', difficulty: 3 },
      ],
    },
    // Subjunctive mood questions
    {
      gapId: 'gap-subjunctive',
      questions: [
        { type: 'multiple_choice', content: 'Choose the correct sentence:', options: JSON.stringify(['If I was rich, I would travel', 'If I were rich, I would travel', 'If I were rich, I will travel', 'If I am rich, I would travel']), answer: 'If I were rich, I would travel', explanation: 'The subjunctive mood uses "were" for hypothetical situations', difficulty: 4 },
        { type: 'multiple_choice', content: 'Complete: "It is essential that he ___ on time."', options: JSON.stringify(['is', 'was', 'be', 'will be']), answer: 'be', explanation: 'After expressions like "it is essential", use the base form (subjunctive)', difficulty: 5 },
        { type: 'fill_blank', content: 'I wish I ___ more time to study.', answer: 'had', explanation: 'The subjunctive "were" or "had" is used with "wish" for unreal conditions', difficulty: 5 },
      ],
    },
    // Quadratic equations questions
    {
      gapId: 'gap-quadratic',
      questions: [
        { type: 'multiple_choice', content: 'Solve: x² = 16', options: JSON.stringify(['x = 4', 'x = ±4', 'x = 8', 'x = ±8']), answer: 'x = ±4', explanation: 'Taking square root of both sides: x = ±4', difficulty: 2 },
        { type: 'multiple_choice', content: 'What are the roots of x² - 5x + 6 = 0?', options: JSON.stringify(['x = 1, 6', 'x = 2, 3', 'x = -2, -3', 'x = 1, 5']), answer: 'x = 2, 3', explanation: 'Factor: (x-2)(x-3) = 0, so x = 2 or x = 3', difficulty: 4 },
        { type: 'fill_blank', content: 'The discriminant of x² + 4x + 4 = 0 is ____.', answer: '0', explanation: 'b² - 4ac = 16 - 16 = 0', difficulty: 4 },
      ],
    },
    // Irregular verbs questions
    {
      gapId: 'gap-irregular-verbs',
      questions: [
        { type: 'multiple_choice', content: 'What is the past tense of "swim"?', options: JSON.stringify(['swimmed', 'swam', 'swum', 'swimming']), answer: 'swam', explanation: 'Swim is an irregular verb: swim → swam → swum', difficulty: 2 },
        { type: 'multiple_choice', content: 'Choose the correct past participle:', options: JSON.stringify(['have done', 'have did', 'have do', 'have doneed']), answer: 'have done', explanation: 'Done is the past participle of do', difficulty: 2 },
        { type: 'fill_blank', content: 'She has ____ (write) three books this year.', answer: 'written', explanation: 'Write → wrote → written (irregular verb)', difficulty: 3 },
      ],
    },
    // French Revolution questions
    {
      gapId: 'gap-french-revolution',
      questions: [
        { type: 'multiple_choice', content: 'When did the French Revolution begin?', options: JSON.stringify(['1776', '1789', '1799', '1815']), answer: '1789', explanation: 'The French Revolution began in 1789 with the storming of the Bastille', difficulty: 2 },
        { type: 'multiple_choice', content: 'Which event marked the start of the French Revolution?', options: JSON.stringify(['Execution of Louis XVI', 'Storming of the Bastille', 'Tennis Court Oath', 'Reign of Terror']), answer: 'Storming of the Bastille', explanation: 'On July 14, 1789, revolutionaries stormed the Bastille prison', difficulty: 3 },
        { type: 'fill_blank', content: 'The three main estates in French society were the clergy, nobility, and the ____.', answer: 'commoners', explanation: 'The Third Estate represented the common people', difficulty: 3 },
      ],
    },
  ];

  const createdQuestions = [];
  for (const data of questionsData) {
    for (const q of data.questions) {
      const question = await prisma.question.create({
        data: {
          type: q.type,
          content: q.content,
          options: q.options || null,
          answer: q.answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          metadata: JSON.stringify({}),
          gapId: data.gapId,
        },
      });
      createdQuestions.push(question);
    }
  }
  console.log(`✅ Created ${createdQuestions.length} questions`);

  const [q1, q2, q3, q4, q5, q6] = createdQuestions;
  if (!q1 || !q2 || !q3 || !q4 || !q5 || !q6) {
    throw new Error('Seed invariant failed: expected at least 6 questions');
  }

  // Create sample assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      id: 'assignment-fractions-001',
      name: 'Fractions Fundamentals',
      description: 'Practice basic fraction operations',
      metadata: JSON.stringify({ targetGaps: ['gap-fractions'], questionCount: 3 }),
      studentId: student.id,
      assignmentQuestions: {
        create: [
          { order: 1, questionId: q1.id },
          { order: 2, questionId: q2.id },
          { order: 3, questionId: q3.id },
        ],
      },
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      id: 'assignment-photosynthesis-001',
      name: 'Photosynthesis Explorer',
      description: 'Learn about plant energy production',
      metadata: JSON.stringify({ targetGaps: ['gap-photosynthesis'], questionCount: 3 }),
      studentId: student.id,
      assignmentQuestions: {
        create: [
          { order: 1, questionId: q4.id },
          { order: 2, questionId: q5.id },
          { order: 3, questionId: q6.id },
        ],
      },
    },
  });

  console.log(`✅ Created ${2} assignments`);

  // Create sample learning sessions with results
  const sessionsData = [
    {
      id: 'session-001',
      assignmentId: assignment1.id,
      gapId: 'gap-fractions',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 12 * 60 * 1000),
      score: 45,
      duration: 12,
    },
    {
      id: 'session-002',
      assignmentId: assignment2.id,
      gapId: 'gap-photosynthesis',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 8 * 60 * 1000),
      score: 80,
      duration: 8,
    },
    {
      id: 'session-003',
      assignmentId: assignment1.id,
      gapId: 'gap-fractions',
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
      score: 60,
      duration: 15,
    },
    {
      id: 'session-004',
      assignmentId: assignment2.id,
      gapId: 'gap-photosynthesis',
      startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
      score: 90,
      duration: 10,
    },
  ];

  for (const sessionData of sessionsData) {
    const session = await prisma.learningSession.create({
      data: {
        id: sessionData.id,
        studentId: student.id,
        assignmentId: sessionData.assignmentId,
        gapId: sessionData.gapId,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        score: sessionData.score,
        duration: sessionData.duration,
      },
    });

    // Create session questions with answers
    const questionsForAssignment = await prisma.assignmentQuestion.findMany({
      where: { assignmentId: sessionData.assignmentId },
      include: { question: true },
      orderBy: { order: 'asc' },
    });

    for (const aq of questionsForAssignment) {
      const isCorrect = Math.random() > 0.5; // Random for demo
      await prisma.sessionQuestion.create({
        data: {
          sessionId: session.id,
          questionId: aq.questionId,
          answer: aq.question.answer || '',
          isCorrect,
          timeTaken: Math.floor(Math.random() * 60) + 10,
          feedback: isCorrect ? 'Correct!' : `The correct answer is: ${aq.question.answer}`,
        },
      });
    }
  }
  console.log(`✅ Created ${sessionsData.length} learning sessions`);

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Test Credentials:');
  console.log(`   Student ID: ${student.id}`);
  console.log(`   Student Name: ${student.name}`);
  console.log(`   Student Email: ${student.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
