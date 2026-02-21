# Architect Memory

## Current Architecture
- **Monorepo**: Next.js frontend + Express backend
- **Database**: Neo4j (graph) + PostgreSQL (via Prisma)
- **Authentication**: NextAuth.js with JWT
- **API**: RESTful with TypeScript interfaces

## Recent Decisions
- Split database between graph and relational
- Adopt Prisma for type-safe database access
- Implement dual-server architecture (Next + Express)

## Architecture Patterns
- **Layered Architecture**: Presentation → Business → Data
- **Microservices**: Frontend and backend separation
- **Repository Pattern**: Through Prisma client
- **Middleware Pattern**: Authentication and error handling

## Technical Constraints
- Must support real-time updates
- Need to handle large datasets efficiently
- Require offline capabilities for some features
- Must be deployable to multiple cloud providers

## Future Considerations
- Implement caching layer (Redis)
- Add GraphQL for complex queries
- Consider event-driven architecture
- Plan for horizontal scaling