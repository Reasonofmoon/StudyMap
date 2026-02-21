# Common Debugging Patterns

## React/Next.js Debugging
- Component re-render issues: Check React.memo usage and prop changes
- API call errors: Verify CORS headers and authentication
- Prisma connection: Ensure DATABASE_URL is properly set
- TypeScript errors: Check imports and type definitions

## Database Debugging
- Neo4j connection: Verify bolt protocol and credentials
- Prisma schema: Check relation fields and foreign keys
- Query performance: Use EXPLAIN ANALYZE for slow queries

## Build Issues
- Module resolution: Check tsconfig.json paths
- Bundle size: Use dynamic imports for large components
- Environment variables: Verify NEXT_PUBLIC_ prefix

## Common Error Patterns
- "Cannot read property 'x' of undefined": Add null checks
- "Type 'X' is not assignable to type 'Y'': Use type assertion or interface
- "Network Error": Check CORS and API endpoints
- "Prisma Client could not connect": Verify database URL and network