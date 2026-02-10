# EduOntology Core Engine

An AI-powered learning platform that analyzes student learning gaps and generates personalized assignments.

## Features

- **Knowledge Graph**: Neo4j-based ontology for educational content
- **AI-Powered Assignment Generation**: Uses Claude API to create personalized questions
- **Interactive Visualizations**: Word Galaxy and Gap Heatmap using D3.js
- **Progress Tracking**: Monitor student performance and improvement over time
- **Modular Architecture**: Type-safe components with Prisma ORM

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database credentials
   ```

3. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/           # React components
│   ├── dashboard/       # Main dashboard
│   ├── word-galaxy/     # Interactive word visualization
│   └── gap-heatmap/     # Performance heatmap
├── services/            # Business logic services
│   └── assignment.service.ts
├── utils/               # Utility functions
│   ├── ai/              # AI service implementations
│   ├── security/        # Security utilities
│   └── shared/          # Shared utilities
├── config/              # Configuration files
│   └── database.ts
└── index.ts             # Main application entry point
```

## API Endpoints

### Assignments
- `POST /api/assignments` - Create new assignment from gaps
- `GET /api/students/:id/assignments` - Get student's assignments
- `POST /api/sessions/:id/submit` - Submit session answers

### Gap Analysis
- `GET /api/gaps` - Get learning gaps

### AI Generation
- `POST /api/ai/generate-question` - Generate AI question
- `POST /api/ai/analyze-performance` - Analyze student performance

## Environment Variables

Required variables in `.env`:
- `DATABASE_URL`: SQLite database URL
- `NEO4J_URL`: Neo4j connection URL
- `NEO4J_USERNAME`: Neo4j username
- `NEO4J_PASSWORD`: Neo4j password
- `ANTHROPIC_API_KEY`: Claude API key
- `JWT_SECRET`: JWT signing secret
- `ENCRYPTION_KEY`: Data encryption key

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:studio` - Open Prisma Studio

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
npm run type-check
```

## Architecture

### Data Layer
- **Prisma**: Type-safe database client
- **Neo4j**: Knowledge graph database
- **SQLite**: Primary data storage

### AI Pipeline
- **Claude API**: Generate educational content
- **Question Types**: Multiple choice, fill-in-blank, essay, matching, ordering
- **Personalization**: Based on student learning gaps

### Frontend
- **React**: Component-based UI
- **D3.js**: Data visualizations
- **TailwindCSS**: Styling

## Security

- Input validation and sanitization
- Environment variable protection
- Rate limiting
- CORS configuration
- Helmet for security headers

## Performance Features

- Semantic zoom in Word Galaxy
- Efficient data loading
- Client-side caching
- Optimized database queries

## Browser Testing

The implementation includes stress testing for:
- Large vocabulary sets (500k words)
- Real-time data updates
- Responsive design
- Performance monitoring

## Future Enhancements

- Real-time collaboration
- Advanced analytics
- Mobile app support
- Integration with learning management systems

## License

MIT License - see LICENSE file for details