/**
 * EduOntology Gap Algorithm Types
 * 3-Layer Map Gap 식별 알고리즘을 위한 타입 정의
 */

// 기본 노드 타입
export interface LearningNode {
  id: string
  type: 'vocabulary' | 'theme' | 'passage'
  term?: string
  name?: string
  title?: string
  description?: string
  difficulty: number  // 1-10 범위
  prerequisites: string[]  // 선수 조건 ID 목록
  dependencies: string[]  // 의존 관계 ID 목록
  layer: Layer  // 속한 계층
  masteryLevel?: number  // 마스터리 수준 (0-1)
  timeEstimate?: number  // 학습 시간 (분)
  category?: string
  tags?: string[]
}

// 레이어 정의
export type Layer = 'L1' | 'L2' | 'L3'

export interface LayerConfig {
  id: Layer
  name: string
  difficultyRange: [number, number]
  color: string
  description: string
}

// 사용자 진도 타입
export interface UserProgress {
  nodeId: string
  masteryLevel: number  // 0-1
  timeSpent: number  // 분
  lastAccessed: string  // ISO 날짜
  attempts: number
  scores?: number[]
}

// Gap 분석 결과
export interface GapAnalysisResult {
  targetNode: LearningNode
  gapScore: number
  gapLevel: 'low' | 'medium' | 'high'
  missingPrerequisites: LearningNode[]
  recommendedPath: LearningNode[]
  estimatedTime: number
  confidence: number
  recommendations: Recommendation[]
}

// 학습 경로 결과
export interface PathResult {
  path: LearningNode[]
  totalCost: number
  totalTime: number
  confidence: number
  alternativePaths: LearningNode[][]
}

// 추천 타입
export interface Recommendation {
  type: 'prerequisite' | 'parallel' | 'review' | 'advanced'
  nodeId: string
  node: LearningNode
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedTime: number
  impact: number  // Gap 점수 개선에 대한 기대 영향력
}

// Gap 메트릭
export interface GapMetrics {
  totalGapScore: number
  averageGapScore: number
  gapDistribution: Record<GapLevel, number>
  mostCommonGaps: Array<{
    nodeId: string
    node: LearningNode
    gapScore: number
    gapCount: number
  }>
  trend: 'improving' | 'stable' | 'worsening'
  improvementRate: number
}

// Gap 분석 옵션
export interface GapAnalysisOptions {
  maxPathLength?: number
  includeAlternatives?: boolean
  confidenceThreshold?: number
  timeLimit?: number
  excludeCompleted?: boolean
}

// 시나리오 타입
export interface GapScenario {
  id: string
  name: string
  description: string
  targetNodes: string[]
  currentNodeId?: string
  userProgress: Map<string, number>
  constraints: {
    maxTime: number
    preferredTopics?: string[]
    excludedTopics?: string[]
  }
}

// 알고리즘 성능 메트릭
export interface AlgorithmPerformance {
  executionTime: number
  memoryUsage: number
  cacheHits: number
  cacheMisses: number
  pathCalculations: number
  averageNodesProcessed: number
  successRate: number
}

// 시각화 데이터
export interface VisualizationData {
  nodes: Array<{
    id: string
    label: string
    x: number
    y: number
    layer: Layer
    difficulty: number
    gapScore?: number
    radius: number
    color: string
  }>
  links: Array<{
    source: string
    target: string
    type: 'prerequisite' | 'dependency'
    strength: number
    color: string
  }>
  layers: LayerConfig[]
}

// Gap 최적화 파라미터
export interface GapOptimizationParams {
  difficultyWeight: number
  prerequisiteWeight: number
  layerWeight: number
  masteryThreshold: number
  maxPathLength: number
  heuristicMode: 'linear' | 'exponential' | 'logarithmic'
}

// 학습 모델 입력
export interface LearningModelInput {
  currentNode: LearningNode
  targetNode: LearningNode
  userHistory: UserProgress[]
  timeOfDay?: string
  dayOfWeek?: string
  sessionDuration?: number
}

// 학습 모델 출력
export interface LearningModelOutput {
  optimalPath: LearningNode[]
  predictedCompletion: number
  difficultyEstimate: number
  estimatedTime: number
  confidence: number
}

// 실시간 Gap 업데이트
export interface GapUpdate {
  type: 'progress' | 'node_added' | 'node_removed' | 'prerequisite_updated'
  nodeId: string
  timestamp: string
  data: any
}

// Gap 이벤트
export interface GapEvent {
  id: string
  type: 'gap_created' | 'gap_closed' | 'path_optimized'
  gapId: string
  userId?: string
  timestamp: string
  details: Record<string, any>
}

// API 응답 타입
export interface GapAPIResponse<T> {
  success: boolean
  data?: T
  error?: string
  metrics?: {
    executionTime: number
    cacheHits: number
  }
}

// 캐시 키 타입
export interface CacheKey {
  userId?: string
  targetNodeId: string
  options: GapAnalysisOptions
  timestamp: string
}

// 캐시 항목
export interface CacheItem {
  key: CacheKey
  data: GapAnalysisResult
  timestamp: string
  expiresAt: string
  accessCount: number
}

// 유효성 검사 스키마
export const GapAnalysisSchema = {
  targetNode: {
    type: 'string',
    required: true,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  currentNodeId: {
    type: 'string',
    required: false,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  userProgress: {
    type: 'object',
    required: true,
    properties: {
      '*': {
        type: 'number',
        minimum: 0,
        maximum: 1
      }
    }
  }
} as const

// 유틸리티 타입
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 이벤트 핸들러 타입
export type GapEventHandler = (event: GapEvent) => void

// 이벤트 버스 인터페이스
export interface GapEventBus {
  subscribe(eventType: string, handler: GapEventHandler): void
  unsubscribe(eventType: string, handler: GapEventHandler): void
  publish(event: GapEvent): void
}

// 플러그인 인터페이스
export interface GapPlugin {
  name: string
  version: string
  initialize(context: GapPluginContext): void
  process(data: any): any
  cleanup(): void
}

export interface GapPluginContext {
  analyzer: GapAnalyzer
  eventBus: GapEventBus
  cache: any
  logger: any
}

// 에러 타입
export interface GapError extends Error {
  code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: any
}

export class GapValidationError extends GapError {
  constructor(message: string, details?: any) {
    super(message)
    this.name = 'GapValidationError'
    this.code = 'VALIDATION_ERROR'
    this.severity = 'medium'
    this.details = details
  }
}

export class GapCalculationError extends GapError {
  constructor(message: string, details?: any) {
    super(message)
    this.name = 'GapCalculationError'
    this.code = 'CALCULATION_ERROR'
    this.severity = 'high'
    this.details = details
  }
}

// 차트 데이터 타입
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
    borderWidth?: number
  }>
}

// 차트 옵션 타입
export interface ChartOptions {
  responsive?: boolean
  maintainAspectRatio?: boolean
  plugins?: {
    title?: {
      display?: boolean
      text?: string
    }
    legend?: {
      display?: boolean
      position?: string
    }
  }
  scales?: {
    x?: {
      display?: boolean
      title?: {
        display?: boolean
        text?: string
      }
    }
    y?: {
      display?: boolean
      title?: {
        display?: boolean
        text?: string
      }
      min?: number
      max?: number
    }
  }
}

// Export all types for external use
export * from './types'