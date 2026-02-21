# Builder-2 Memory

## Current Backend Stack
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Prisma) + Neo4j
- **Authentication**: JWT with NextAuth.js
- **Validation**: Zod schemas
- **Error Handling**: Custom error classes

## API Patterns
- RESTful endpoint design
- Type-safe request/response schemas
- Proper HTTP status codes
- Error handling middleware
- Authentication middleware

## Recent Implementations
- User management APIs
- Course content APIs
- Progress tracking endpoints
- Neo4j integration for relationships

## Database Integration
- Prisma for PostgreSQL operations
- Neo4j driver for graph queries
- Connection pooling for performance
- Transaction management
- Data migrations

## Best Practices
- Use environment variables for configuration
- Implement proper logging
- Use dependency injection where appropriate
- Follow SOLID principles
- Write comprehensive tests

## Known Issues
- Some endpoints need optimization
- Database connection pooling needs tuning
- Error responses could be more consistent
- Caching layer needed for performance