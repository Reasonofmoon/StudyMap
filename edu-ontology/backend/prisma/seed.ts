import { PrismaClient } from '@prisma/client';
import { initKnowledgeGraph } from '../src/db/neo4j';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample students
  const student1 = await prisma.student.create({
    data: {
      email: 'student1@example.com',
      level: 'A1',
      gapData: {
        vocabulary: ['apple', 'banana', 'cat'],
        grammar: ['present', 'past'],
        totalWords: 100,
        mastered: 45
      }
    }
  });

  const student2 = await prisma.student.create({
    data: {
      email: 'student2@example.com',
      level: 'B1',
      gapData: {
        vocabulary: ['sophisticated', 'complex', 'nuanced'],
        grammar: ['conditional', 'subjunctive'],
        totalWords: 500,
        mastered: 380
      }
    }
  });

  // Create sample assignments
  const assignments = await prisma.assignment.createMany({
    data: [
      {
        studentId: student1.id,
        type: 'semantic_unit',
        difficulty: 'easy',
        content: {
          question: "다음 중 'apple'의 의미와 가장 비슷한 단어는?",
          options: ['banana', 'orange', 'car'],
          answer: 'banana',
          explanation: 'Apple과 banana는 모두 과일입니다.'
        }
      },
      {
        studentId: student2.id,
        type: 'pragmatics',
        difficulty: 'hard',
        content: {
          question: "상대방의 제안을 거절할 때 적절한 표현은?",
          options: [
            'No, I don\\'t like it.',
            'That\\'s an interesting suggestion, but...',
            'You are wrong.'
          ],
          answer: 'That\'s an interesting suggestion, but...',
          explanation: '적절한 거절 표현은 상대방의 감정을 고려해야 합니다.'
        }
      }
    ]
  });

  // Initialize Neo4j knowledge graph
  try {
    await initKnowledgeGraph();
    console.log('✅ Neo4j knowledge graph initialized');
  } catch (error) {
    console.warn('⚠️ Neo4j initialization failed:', error);
  }

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created ${student1.level} student: ${student1.email}`);
  console.log(`📊 Created ${student2.level} student: ${student2.email}`);
  console.log(`📊 Created ${assignments.count} sample assignments`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });