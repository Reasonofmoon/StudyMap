# EduOntology - Next.js 14 + Neo4j Integration Guide

## Overview
This document provides comprehensive documentation for the Type-safe Neo4j integration with Next.js 14 in the EduOntology platform.

## Architecture

### 1. Technology Stack
- **Frontend**: Next.js 14 (App Router)
- **Database**: Neo4j 5.x
- **Type Safety**: TypeScript with Zod validation
- **State Management**: React Query (TanStack Query)
- **GraphQL**: Neo4j GraphQL Library
- **Styling**: Tailwind CSS

### 2. Project Structure
```
/
├── lib/
│   └── neo4j/
│       ├── config.ts          # Neo4j configuration
│       ├── driver.ts          # Type-safe driver implementation
│       └── types.ts           # Neo4j type definitions
├── app/
│   └── api/
│       └── vocabularies/
│           └── route.ts       # API route for vocabularies
├── hooks/
│   └── useNeo4j.ts           # React Query hooks
├── neo4j-schema.graphql      # GraphQL schema
├── next.config.ts            # Next.js configuration
└── tsconfig.json             # TypeScript configuration
```

## Configuration

### 1. Environment Variables
Create `.env.local` file with the following variables:

```env
# Neo4j Configuration
NEO4J_URL=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=eduontology

# Next.js Configuration
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
```

### 2. Neo4j Schema Setup
Create the database schema by running Cypher queries:

```cypher
// Create constraints for unique IDs
CREATE CONSTRAINT vocab_term_unique IF NOT EXISTS FOR (v:Vocabulary) REQUIRE v.term IS UNIQUE;
CREATE CONSTRAINT theme_name_unique IF NOT EXISTS FOR (t:Theme) REQUIRE t.name IS UNIQUE;
CREATE CONSTRAINT passage_title_unique IF NOT EXISTS FOR (p:Passage) REQUIRE p.title IS UNIQUE;

// Create indexes for performance
CREATE INDEX vocab_difficulty_idx FOR (v:Vocabulary) ON (v.difficultyLevel);
CREATE INDEX reading_level_idx FOR (p:Passage) ON (p.readingLevel);
CREATE INDEX theme_complexity_idx FOR (t:Theme) ON (t.complexity);
```

## Type-Safe Implementation

### 1. Neo4j Configuration (`lib/neo4j/config.ts`)

Key features:
- Environment-based configuration
- Connection pooling settings
- Retry logic with exponential backoff
- Performance monitoring

```typescript
// Example configuration
export const neo4jConfig: Neo4jConfig = {
  url: process.env.NEO4J_URL || 'bolt://localhost:7687',
  username: process.env.NEO4J_USERNAME || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'eduontology',
  connectionPool: {
    maxConnectionPoolSize: 100,
    connectionAcquisitionTimeout: 30000,
    maxConnectionLifetime: 3600000,
  },
  retry: {
    maxRetryAttempts: 5,
    initialRetryDelay: 1000,
    maxRetryDelay: 10000,
  },
}
```

### 2. Type-Safe Driver (`lib/neo4j/driver.ts`)

Features:
- Custom error handling
- Performance metrics
- Transaction support
- Query validation

```typescript
// Usage example
export async function getVocabularies() {
  const result = await neo4j.read(`
    MATCH (v:Vocabulary)
    RETURN v
    LIMIT 10
  `)

  return result.records.map(record => record.get('v').properties)
}
```

### 3. API Routes (`app/api/vocabularies/route.ts`)

RESTful API with:
- Zod validation
- Error handling
- CORS protection
- Rate limiting

```typescript
// GET /api/vocabularies
export async function GET(request: NextRequest) {
  const query = VocabularyQuerySchema.parse({
    first: parseInt(url.searchParams.get('first') || '50'),
    skip: parseInt(url.searchParams.get('skip') || '0'),
    term_contains: url.searchParams.get('term_contains'),
  })

  // Execute query
  const result = await neo4j.read(cypherQuery, parameters)

  return NextResponse.json({
    success: true,
    data: result.records,
    pagination: { first: query.first, skip: query.skip, total: result.count }
  })
}
```

### 4. React Query Hooks (`hooks/useNeo4j.ts`)

React hooks for:
- Data fetching and caching
- Mutation management
- Optimistic updates
- Performance monitoring

```typescript
// Usage in components
export function VocabularyList() {
  const { data, error, isLoading } = useVocabularies({
    first: 20,
    skip: 0,
    difficultyLevel_gte: 5,
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <Error message={error.message} />

  return (
    <div>
      {data.map(vocab => (
        <VocabularyCard key={vocab.id} data={vocab} />
      ))}
    </div>
  )
}
```

## GraphQL Integration

### 1. Schema Definition (`neo4j-schema.graphql`)

GraphQL schema with:
- Type-safe definitions
- Relationship types
- Query and mutation types
- Input types

```graphql
type Vocabulary @node {
  id: ID!
  term: String!
  definition: String!
  difficultyLevel: Int!
  # ... other fields
}

type Query {
  vocabularies(
    first: Int = 50
    skip: Int = 0
    filter: VocabularyFilter
  ): [Vocabulary!]!
}
```

### 2. Query Execution

```typescript
// Using GraphQL client
export async function createVocabulary(input: CreateVocabularyInput) {
  const result = await graphqlRequest({
    query: `
      mutation CreateVocabulary($input: CreateVocabularyInput!) {
        createVocabulary(input: $input) {
          id
          term
          definition
        }
      }
    `,
    variables: { input },
  })

  return result.createVocabulary
}
```

## Performance Optimization

### 1. Query Optimization

```cypher
// Use indexes for faster queries
MATCH (v:Vocabulary) WHERE v.difficultyLevel >= 5
  RETURN v
  ORDER BY v.term ASC
  SKIP 0 LIMIT 20

// Avoid expensive operations
MATCH (v:Vocabulary)-[:APPEARS_IN]->(p:Passage)
  WHERE v.difficultyLevel > 7
  RETURN v.term, p.title
```

### 2. Caching Strategy

React Query caching:
- Stale time: 5 minutes
- Cache time: 10 minutes
- Refetch on window focus
- Refetch on mount

```typescript
const { data } = useVocabularies({
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: true,
  refetchOnMount: true,
})
```

### 3. Connection Pooling

Configure connection pool settings:
```typescript
export const neo4jConfig: Neo4jConfig = {
  connectionPool: {
    maxConnectionPoolSize: process.env.NODE_ENV === 'production' ? 100 : 50,
    connectionAcquisitionTimeout: 30000,
    maxConnectionLifetime: 3600000,
  },
}
```

## Error Handling

### 1. Custom Error Types

```typescript
export class Neo4jConnectionError extends Error {
  code = 'NEO4J_CONNECTION_ERROR'
  constructor(message: string) {
    super(message)
    this.name = 'Neo4jConnectionError'
  }
}

export class Neo4jQueryError extends Error {
  code = 'NEO4J_QUERY_ERROR'
  constructor(message: string) {
    super(message)
    this.name = 'Neo4jQueryError'
  }
}
```

### 2. Error Handling in API Routes

```typescript
try {
  const result = await neo4j.read(cypher, parameters)
  return NextResponse.json({ success: true, data: result.records })
} catch (error) {
  if (error instanceof Neo4jConnectionError) {
    return NextResponse.json(
      { success: false, error: 'Database connection failed' },
      { status: 503 }
    )
  }
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}
```

## Monitoring and Metrics

### 1. Performance Metrics

Track:
- Query execution time
- Row count
- Cache hit/miss rates
- Error rates

```typescript
// Get metrics
const metrics = neo4j.getMetrics()
console.log({
  executionTime: metrics.executionTime,
  rowCount: metrics.rowCount,
  queryCount: metrics.queryCount,
  errorCount: metrics.errorCount,
})
```

### 2. Health Checks

```typescript
// Health check endpoint
export async function GET() {
  const health = await neo4j.healthCheck()
  return NextResponse.json({
    healthy: health.healthy,
    latency: health.latency,
    timestamp: new Date().toISOString(),
  })
}
```

## Testing

### 1. Unit Tests

```typescript
import { neo4jDriver } from '@/lib/neo4j/driver'

describe('Neo4j Driver', () => {
  test('should connect to database', async () => {
    const health = await neo4jDriver.healthCheck()
    expect(healthy).toBe(true)
  })
})
```

### 2. Integration Tests

```typescript
describe('API Routes', () => {
  test('GET /api/vocabularies should return vocabularies', async () => {
    const response = await fetch('/api/vocabularies')
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })
})
```

## Deployment

### 1. Environment Configuration

Production:
- Use production database
- Enable compression
- Set proper caching headers
- Configure monitoring

```bash
# Production build
npm run build

# Start production
npm run start
```

### 2. Docker Configuration

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Best Practices

### 1. Type Safety
- Always use TypeScript interfaces
- Validate input with Zod
- Use generic types for reusability

### 2. Error Handling
- Handle specific error types
- Provide meaningful error messages
- Log errors for debugging

### 3. Performance
- Use indexes for frequent queries
- Implement proper caching
- Monitor query performance

### 4. Security
- Validate all inputs
- Use parameterized queries
- Protect against SQL injection

### 5. Maintenance
- Regularly update dependencies
- Monitor metrics
- Implement proper logging

## Troubleshooting

### 1. Common Issues

**Connection Issues**
```typescript
// Check connectivity
const health = await neo4j.healthCheck()
if (!health.healthy) {
  throw new Neo4jConnectionError('Database not available')
}
```

**Query Performance**
```typescript
// Slow query analysis
const result = await neo4j.read(slowQuery)
const executionTime = result.metadata.executionTime
if (executionTime > 1000) {
  console.warn(`Query took ${executionTime}ms to execute`)
}
```

### 2. Debug Mode

Enable debug logging:
```typescript
export const neo4jConfig: Neo4jConfig = {
  // ... other config
  logging: {
    level: 'debug',
    enabled: process.env.NODE_ENV === 'development',
  },
}
```

## Next Steps

1. Implement authentication
2. Add real-time features
3. Implement caching layer
4. Add analytics
5. Scale for production