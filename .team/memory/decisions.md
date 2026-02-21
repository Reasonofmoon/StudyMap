# Architecture Decisions

## Tech Stack
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Express.js with Prisma
- **Database**: Neo4j (graph) + PostgreSQL (relational)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + CSS Modules

## Design Principles
- **Type-Safe**: All APIs and components use TypeScript
- **Modular**: Single responsibility for each component/module
- **MECE**: Mutually Exclusive, Collectively Exhaustive approach
- **Performance**: Code splitting and lazy loading where appropriate

## Database Architecture
- **Neo4j**: For relationship data (users, courses, progress)
- **Prisma**: For relational data and type-safe queries
- **Separation**: Graph DB for connections, SQL for structured data

## API Design
- RESTful endpoints with consistent naming
- Type-safe responses using Zod/TS interfaces
- Proper error handling with status codes
- Authentication middleware on protected routes

## Security Decisions
- CORS configured for production domains
- Environment variables for sensitive data
- Input validation on all endpoints
- SQL injection prevention through Prisma ORM