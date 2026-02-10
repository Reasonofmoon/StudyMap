import { PrismaClient } from '@prisma/client';
import { Neo4jGraphQL } from '@neo4j/graphql';
import { Driver } from 'neo4j-driver';

// Database connection singleton
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Neo4j driver setup
const neo4jDriver = (): Driver => {
  if (!process.env.NEO4J_URL) {
    throw new Error('NEO4J_URL is required');
  }

  const { Neo4jGraphQL } = require('@neo4j/graphql');
  const { Neo4jJWTAuth } = require('@neo4j/graphql');

  return new Neo4jGraphQL({
    typeDefs: `
      # Knowledge graph types will be defined here
      type KnowledgeNode {
        id: ID!
        label: String!
        properties: JSON!
        related: [KnowledgeNode!] @relationship(direction: OUT, type: "RELATED_TO")
      }

      type KnowledgeGraph {
        nodes: [KnowledgeNode!]!
        relationships: [Relationship!]!
      }

      type Relationship {
        id: ID!
        type: String!
        properties: JSON!
        from: KnowledgeNode!
        to: KnowledgeNode!
      }
    `,
    resolvers: {},
    driver: process.env.NEO4J_URL,
    context: { prisma }
  });
};

// Health check function
const healthCheck = async () => {
  try {
    // Test Prisma connection
    await prisma.$executeRaw`SELECT 1`;
    console.log('✅ Prisma database connection healthy');

    // Test Neo4j connection (when driver is available)
    if (process.env.NEO4J_URL) {
      const driver = neo4jDriver();
      const session = driver.session();
      await session.run('RETURN 1');
      await session.close();
      console.log('✅ Neo4j connection healthy');
    }
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    throw error;
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  await prisma.$disconnect();
  console.log('👋 Database connections closed');
};

export { prisma, neo4jDriver, healthCheck, gracefulShutdown };