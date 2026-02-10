/**
 * EduOntology TypeScript Type Definitions
 * Comprehensive type definitions for the entire platform
 */

// Vocabulary Types
export interface Vocabulary {
  id: string
  term: string
  definition: string
  partOfSpeech: string
  difficultyLevel: number
  exampleSentence?: string
  synonyms: string[]
  antonyms: string[]
  createdAt: string
  updatedAt: string
  relationships: {
    appearsInCount: number
    prerequisitesCount: number
    requiredByCount: number
  }
}

// Theme Types
export interface Theme {
  id: string
  name: string
  description: string
  category: string
  complexity: number
  keywords: string[]
  createdAt: string
  updatedAt: string
}

// Passage Types
export interface Passage {
  id: string
  title: string
  content: string
  readingLevel: number
  wordCount: number
  genre: string
  topics: string[]
  publishedAt: string
  source: string
}

// Learning Path Types
export interface LearningPathResponse {
  id: string
  startNode: LearningNode
  endNode: LearningNode
  steps: LearningPathStep[]
  totalDifficulty: number
  estimatedTime: number
}

export interface LearningNode {
  id: string
  type: 'Vocabulary' | 'Theme'
  term?: string
  name?: string
}

export interface LearningPathStep {
  currentNode: LearningNode
  nextNode: LearningNode
  relationshipType: string
  confidence: number
}

// Gap Analysis Types
export interface GapAnalysisResponse {
  currentNode: LearningNode
  missingPrerequisites: LearningNode[]
  recommendedPath: LearningNode[]
  gapScore: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    first: number
    skip: number
    total: number
  }
}

// Performance Metrics Types
export interface PerformanceMetrics {
  executionTime: number
  rowCount: number
  count: number
  avgExecutionTime: number
  queryCount: number
  errorCount: number
}

export interface HealthCheckResponse {
  healthy: boolean
  latency: number
  version?: string
}

// GraphQL Types
export interface GraphQLQuery {
  query: string
  variables?: Record<string, any>
}

export interface GraphQLResponse<T> {
  data?: T
  errors?: any[]
}

// UI Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface VisualizationProps {
  width?: number
  height?: number
  className?: string
}

export interface InteractiveProps {
  onNodeClick?: (node: any) => void
  onStepClick?: (step: any) => void
  onGapResolved?: (gapId: string) => void
}

// Filter Types
export interface VocabFilter {
  term_contains?: string
  partOfSpeech?: string
  difficultyLevel_gte?: number
  difficultyLevel_lte?: number
}

export interface ThemeFilter {
  name_contains?: string
  category?: string
  complexity_gte?: number
  complexity_lte?: number
}

export interface PassageFilter {
  title_contains?: string
  readingLevel_gte?: number
  readingLevel_lte?: number
  genre?: string
}

// Sorting Types
export interface SortOptions {
  field: string
  direction: 'ASC' | 'DESC'
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  currentLevel: number
  preferences: UserPreferences
  learningProgress: LearningProgress[]
}

export interface UserPreferences {
  language: string
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced'
  visualizationPreference: '2d' | '3d' | 'text'
}

export interface LearningProgress {
  nodeId: string
  nodeType: 'Vocabulary' | 'Theme' | 'Passage'
  status: 'not-started' | 'in-progress' | 'completed'
  progress: number
  lastAccessed: string
  timeSpent: number
  score?: number
}

// Analytics Types
export interface AnalyticsEvent {
  type: 'page-view' | 'node-click' | 'path-created' | 'gap-closed'
  nodeId?: string
  pathId?: string
  userId?: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface AnalyticsData {
  totalViews: number
  uniqueNodes: number
  averageSessionTime: number
  popularNodes: Array<{
    id: string
    name: string
    views: number
  }>
}

// Configuration Types
export interface AppConfiguration {
  features: {
    learningPaths: boolean
    gapAnalysis: boolean
    realTimeSync: boolean
    recommendations: boolean
  }
  performance: {
    monitoringEnabled: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    cacheTTL: number
  }
  neo4j: {
    url: string
    username: string
    password: string
    database: string
  }
}

// Export all types for easy importing
export type * from './vocabulary'
export type * from './theme'
export type * from './passage'
export type * from './learning-path'
export type * from './gap-analysis'
export type * from './api'
export type * from './performance'
export type * from './graphql'
export type * from './ui'
export type * from './filter'
export type * from './error'
export type * from './user'
export type * from './analytics'
export type * from './configuration'