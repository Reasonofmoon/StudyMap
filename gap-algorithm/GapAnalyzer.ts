/**
 * EduOntology Gap Analyzer
 * 3-Layer Map에서 학습 격차를 식별하고 분석하는 핵심 알고리즘
 */

import { LearningNode, Layer, GapAnalysisResult, PathResult } from './types'

// Gap 식별을 위한 휴리스틱 상수
const HEURISTIC_WEIGHTS = {
  DIFFICULTY_GAP: 0.4,
  PREREQUISITE_GAP: 0.4,
  LAYER_GAP: 0.2,
  MASTERY_THRESHOLD: 0.8,
} as const

// 레이어 가중치
const LAYER_WEIGHTS = {
  L1: { L1: 0, L2: 30, L3: 60 },
  L2: { L1: 30, L2: 0, L3: 30 },
  L3: { L1: 60, L2: 30, L3: 0 }
} as const

// Gap 레벨 정의
export type GapLevel = 'low' | 'medium' | 'high'
export type GapPriority = 'immediate' | 'short-term' | 'long-term'

export interface GapMetrics {
  totalGapScore: number
  averageGapScore: number
  gapDistribution: Record<GapLevel, number>
  mostCommonGaps: Array<{
    nodeId: string
    gapScore: number
    gapCount: number
  }>
}

export interface GapAnalysisDetail {
  nodeId: string
  targetNodeId: string
  gapScore: number
  gapLevel: GapLevel
  priority: GapPriority
  missingPrerequisites: LearningNode[]
  recommendedPath: LearningNode[]
  estimatedTime: number
  timeBreakdown: {
    prerequisites: number
    mainContent: number
    review: number
  }
}

export class GapAnalyzer {
  private nodes: Map<string, LearningNode>
  private userProgress: Map<string, number>

  constructor(nodes: LearningNode[], userProgress: Map<string, number>) {
    this.nodes = new Map(nodes.map(node => [node.id, node]))
    this.userProgress = new Map(userProgress)
  }

  /**
   * 단일 Gap 분석 실행
   */
  analyzeGap(targetNodeId: string, currentLevel?: number): GapAnalysisResult {
    const targetNode = this.nodes.get(targetNodeId)
    if (!targetNode) {
      throw new Error(`Target node not found: ${targetNodeId}`)
    }

    // 사용자의 현재 수준 결정
    const currentNode = this.determineCurrentLevel(currentLevel)
    if (!currentNode) {
      throw new Error('Could not determine current level')
    }

    // Gap 점수 계산
    const gapScore = this.calculateGapScore(currentNode, targetNode)

    // 선수 조분석
    const missingPrerequisites = this.findMissingPrerequisites(targetNode)

    // 최적 경로 찾기
    const recommendedPath = this.findOptimalPath(currentNode.id, targetNode.id)

    // 예상 시간 계산
    const estimatedTime = this.calculateEstimatedTime(recommendedPath)

    return {
      targetNode,
      gapScore,
      missingPrerequisites,
      recommendedPath,
      estimatedTime,
      confidence: this.calculateConfidence(gapScore, missingPrerequisites.length),
    }
  }

  /**
   * 다중 Gap 분석 (비교)
   */
  analyzeMultipleGaps(
    targetNodeIds: string[],
    currentLevel?: number
  ): GapAnalysisDetail[] {
    return targetNodeIds.map(targetId => {
      const result = this.analyzeGap(targetId, currentLevel)

      return {
        nodeId: this.getCurrentNodeId(currentLevel),
        targetNodeId: targetId,
        gapScore: result.gapScore,
        gapLevel: this.determineGapLevel(result.gapScore),
        priority: this.determinePriority(result.gapScore, result.estimatedTime),
        missingPrerequisites: result.missingPrerequisites,
        recommendedPath: result.recommendedPath,
        estimatedTime: result.estimatedTime,
        timeBreakdown: this.breakdownTime(result.recommendedPath),
      }
    }).sort((a, b) => b.gapScore - a.gapScore)
  }

  /**
   * Gap 메트릭 수집
   */
  collectGapMetrics(targetNodeIds: string[]): GapMetrics {
    const analyses = this.analyzeMultipleGaps(targetNodeIds)

    let totalGapScore = 0
    const gapDistribution = { low: 0, medium: 0, high: 0 }
    const gapCounts = new Map<string, number>()

    analyses.forEach(analysis => {
      totalGapScore += analysis.gapScore
      gapDistribution[analysis.gapLevel]++

      gapCounts.set(analysis.targetNodeId,
        (gapCounts.get(analysis.targetNodeId) || 0) + 1
      )
    })

    // 가장 자주 나타나는 Gap
    const mostCommonGaps = Array.from(gapCounts.entries())
      .map(([nodeId, count]) => ({
        nodeId,
        gapScore: analyses.find(a => a.targetNodeId === nodeId)?.gapScore || 0,
        gapCount: count,
      }))
      .sort((a, b) => b.gapCount - a.gapCount)
      .slice(0, 10)

    return {
      totalGapScore,
      averageGapScore: totalGapScore / analyses.length,
      gapDistribution,
      mostCommonGaps,
    }
  }

  /**
   * Gap 등급 판단
   */
  private determineGapLevel(gapScore: number): GapLevel {
    if (gapScore <= 33) return 'low'
    if (gapScore <= 66) return 'medium'
    return 'high'
  }

  /**
   * 우선순위 판단
   */
  private determinePriority(gapScore: number, estimatedTime: number): GapPriority {
    const timeHours = estimatedTime / 60

    if (gapScore >= 80 || timeHours <= 1) return 'immediate'
    if (gapScore >= 50 || timeHours <= 3) return 'short-term'
    return 'long-term'
  }

  /**
   * 사용자 현재 수준 결정
   */
  private determineCurrentLevel(currentLevel?: number): LearningNode | null {
    if (currentLevel) {
      // 지정된 레벨로부터 현재 노드 선택
      const candidates = Array.from(this.nodes.values())
        .filter(node => Math.abs(node.difficulty - currentLevel) <= 1)

      if (candidates.length > 0) {
        return candidates.sort((a, b) => {
          const aMastery = this.userProgress.get(a.id) || 0
          const bMastery = this.userProgress.get(b.id) || 0
          return bMastery - aMastery
        })[0]
      }
    }

    // 사용자 진도 기반 현재 레벨 결정
    const masteredNodes = Array.from(this.userProgress.entries())
      .filter(([, mastery]) => mastery >= HEURISTIC_WEIGHTS.MASTERY_THRESHOLD)

    if (masteredNodes.length === 0) {
      // 가장 낮은 난이도 노드 선택
      return Array.from(this.nodes.values())
        .filter(node => node.difficulty <= 3)[0] || null
    }

    // 마스터리 기반 현재 레벨 계산
    const avgDifficulty = masteredNodes.reduce((sum, [nodeId]) => {
      const node = this.nodes.get(nodeId)
      return sum + (node?.difficulty || 0)
    }, 0) / masteredNodes.length

    return Array.from(this.nodes.values())
      .filter(node => Math.abs(node.difficulty - avgDifficulty) <= 1)[0] || null
  }

  /**
   * Gap 점수 계산
   */
  private calculateGapScore(fromNode: LearningNode, toNode: LearningNode): number {
    const difficultyGap = this.calculateDifficultyGap(fromNode, toNode)
    const prerequisiteGap = this.calculatePrerequisiteGap(toNode)
    const layerGap = this.calculateLayerGap(fromNode, toNode)

    const weightedScore = (
      difficultyGap * HEURISTIC_WEIGHTS.DIFFICULTY_GAP +
      prerequisiteGap * HEURISTIC_WEIGHTS.PREREQUISITE_GAP +
      layerGap * HEURISTIC_WEIGHTS.LAYER_GAP
    ) / 3

    return Math.min(100, Math.max(0, weightedScore))
  }

  /**
   * 난이도 Gap 계산
   */
  private calculateDifficultyGap(fromNode: LearningNode, toNode: LearningNode): number {
    const maxDifficulty = 10
    const difficultyDiff = toNode.difficulty - fromNode.difficulty
    return Math.min(100, (difficultyDiff / maxDifficulty) * 100)
  }

  /**
   * 선수 조건 Gap 계산
   */
  private calculatePrerequisiteGap(toNode: LearningNode): number {
    if (toNode.prerequisites.length === 0) return 0

    let totalGap = 0
    let satisfiedCount = 0

    for (const prereqId of toNode.prerequisites) {
      const userMastery = this.userProgress.get(prereqId) || 0

      if (userMastery >= HEURISTIC_WEIGHTS.MASTERY_THRESHOLD) {
        satisfiedCount++
      } else {
        totalGap += (1 - userMastery) * 100
      }
    }

    return (totalGap / toNode.prerequisites.length)
  }

  /**
   * 레이어 Gap 계산
   */
  private calculateLayerGap(fromNode: LearningNode, toNode: LearningNode): number {
    return LAYER_WEIGHTS[fromNode.layer][toNode.layer]
  }

  /**
   * 부족한 선수 조건 찾기
   */
  private findMissingPrerequisites(toNode: LearningNode): LearningNode[] {
    const missing: LearningNode[] = []

    for (const prereqId of toNode.prerequisites) {
      const userMastery = this.userProgress.get(prereqId) || 0
      const prerequisiteNode = this.nodes.get(prereqId)

      if (userMastery < HEURISTIC_WEIGHTS.MASTERY_THRESHOLD && prerequisiteNode) {
        missing.push(prerequisiteNode)
      }
    }

    return missing.sort((a, b) => a.difficulty - b.difficulty)
  }

  /**
   * 최적 학습 경로 찾기 (A* 알고리즘)
   */
  private findOptimalPath(fromNodeId: string, toNodeId: string): LearningNode[] {
    const openSet = new Map<string, number>()
    const cameFrom = new Map<string, string>()
    const gScore = new Map<string, number>()
    const fScore = new Map<string, number>()

    // 초기화
    Array.from(this.nodes.keys()).forEach(nodeId => {
      gScore.set(nodeId, Infinity)
      fScore.set(nodeId, Infinity)
    })

    gScore.set(fromNodeId, 0)
    fScore.set(fromNodeId, this.heuristic(fromNodeId, toNodeId))
    openSet.set(fromNodeId, fScore.get(fromNodeId)!)

    while (openSet.size > 0) {
      // fScore가 가장 낮은 노드 선택
      const current = this.findLowestFScore(openSet)
      const currentNode = this.nodes.get(current)!

      if (current === toNodeId) {
        return this.reconstructPath(cameFrom, current)
      }

      openSet.delete(current)

      // 인접 노드 탐색
      const neighbors = this.getNeighbors(currentNode)

      for (const neighbor of neighbors) {
        const tentativeGScore = gScore.get(current)! + this.calculateTransitionCost(currentNode, neighbor)

        if (tentativeGScore < (gScore.get(neighbor.id) || Infinity)) {
          cameFrom.set(neighbor.id, current)
          gScore.set(neighbor.id, tentativeGScore)
          fScore.set(neighbor.id, tentativeGScore + this.heuristic(neighbor.id, toNodeId))

          if (!openSet.has(neighbor.id)) {
            openSet.set(neighbor.id, fScore.get(neighbor.id)!)
          }
        }
      }
    }

    // 경로가 없는 경우, 최소한의 선수 조건만 포함
    return this.findMinimalPath(fromNodeId, toNodeId)
  }

  /**
   * 인접 노드 찾기
   */
  private getNeighbors(node: LearningNode): LearningNode[] {
    const neighbors: LearningNode[] = []

    // 선수 조건을 인접 노드로 간주
    for (const prereqId of node.prerequisites) {
      const prereqNode = this.nodes.get(prereqId)
      if (prereqNode) neighbors.push(prereqNode)
    }

    // 의존 노드 추가
    for (const otherNode of this.nodes.values()) {
      if (otherNode.prerequisites.includes(node.id)) {
        neighbors.push(otherNode)
      }
    }

    return neighbors.filter(neighbor => neighbor.id !== node.id)
  }

  /**
   * 휴리스틱 함수
   */
  private heuristic(fromNodeId: string, toNodeId: string): number {
    const fromNode = this.nodes.get(fromNodeId)
    const toNode = this.nodes.get(toNodeId)

    if (!fromNode || !toNode) return 0

    // 난이도 차이를 휴리스틱으로 사용
    return Math.abs(toNode.difficulty - fromNode.difficulty)
  }

  /**
   * 낮은 fScore 찾기
   */
  private findLowestFScore(openSet: Map<string, number>): string {
    let lowestScore = Infinity
    let lowestNode = ''

    for (const [nodeId, score] of openSet) {
      if (score < lowestScore) {
        lowestScore = score
        lowestNode = nodeId
      }
    }

    return lowestNode
  }

  /**
   * 경로 재구성
   */
  private reconstructPath(cameFrom: Map<string, string>, current: string): LearningNode[] {
    const path: LearningNode[] = []
    let node = current

    while (node) {
      const nodeData = this.nodes.get(node)
      if (nodeData) path.unshift(nodeData)
      node = cameFrom.get(node) || ''
    }

    return path
  }

  /**
   * 전환 비용 계산
   */
  private calculateTransitionCost(fromNode: LearningNode, toNode: LearningNode): number {
    let cost = 0

    // 난이도 차이
    cost += Math.abs(toNode.difficulty - fromNode.difficulty) * 10

    // 레이어 이동 비용
    cost += LAYER_WEIGHTS[fromNode.layer][toNode.layer]

    // 사용자 마스터리 고려
    const userMastery = this.userProgress.get(fromNode.id) || 0
    cost += (1 - userMastery) * 5

    return cost
  }

  /**
   * 최소 경로 찾기
   */
  private findMinimalPath(fromNodeId: string, toNodeId: string): LearningNode[] {
    const targetNode = this.nodes.get(toNodeId)
    if (!targetNode) return []

    // 부족한 선수 조건만 포함
    const missing = this.findMissingPrerequisites(targetNode)

    // 경로 구성
    const path: LearningNode[] = []

    // 시작 노드 추가
    const fromNode = this.nodes.get(fromNodeId)
    if (fromNode) path.push(fromNode)

    // 부족한 선수 조건 추가
    path.push(...missing)

    // 목표 노드 추가
    path.push(targetNode)

    return path
  }

  /**
   * 예상 학습 시간 계산
   */
  private calculateEstimatedTime(path: LearningNode[]): number {
    return path.reduce((total, node) => {
      const baseTime = node.difficulty * 15 // 기본 시간: 난이도 × 15분
      const userMastery = this.userProgress.get(node.id) || 0

      // 마스터리 수준에 따라 시간 조정
      const adjustedTime = baseTime * (1 - userMastery * 0.5)
      return total + adjustedTime
    }, 0)
  }

  /**
   * 시간 분해
   */
  private breakdownTime(path: LearningNode[]) {
    const totalTime = this.calculateEstimatedTime(path)

    return {
      prerequisites: Math.round(totalTime * 0.3),
      mainContent: Math.round(totalTime * 0.6),
      review: Math.round(totalTime * 0.1),
    }
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(gapScore: number, missingCount: number): number {
    const gapConfidence = Math.max(0, 100 - gapScore)
    const prerequisiteConfidence = Math.max(0, 100 - missingCount * 10)

    return (gapConfidence + prerequisiteConfidence) / 2
  }

  /**
   * 현재 노드 ID 가져오기
   */
  private getCurrentNodeId(currentLevel?: number): string {
    const currentNode = this.determineCurrentLevel(currentLevel)
    return currentNode?.id || 'unknown'
  }
}

// Gap 알고리즘 유틸리티 함수
export function createGapAnalyzer(
  nodes: LearningNode[],
  userProgress: Map<string, number>
): GapAnalyzer {
  return new GapAnalyzer(nodes, userProgress)
}

export function optimizeGapThresholds(
  analyses: GapAnalysisDetail[],
  targetDistribution: Record<GapLevel, number>
): {
  lowThreshold: number
  mediumThreshold: number
} {
  // 분포에 맞게 임계값 조정
  const sorted = analyses.sort((a, b) => a.gapScore - b.gapScore)
  const total = sorted.length

  const lowTarget = total * (targetDistribution.low / 100)
  const mediumTarget = total * ((targetDistribution.low + targetDistribution.medium) / 100)

  let lowThreshold = 33
  let mediumThreshold = 66

  // 분포 기반 임계값 계산
  let lowCount = 0
  for (const analysis of sorted) {
    if (lowCount >= lowTarget) break
    lowThreshold = Math.max(lowThreshold, analysis.gapScore)
    lowCount++
  }

  let mediumCount = lowCount
  for (const analysis of sorted) {
    if (mediumCount >= mediumTarget) break
    mediumThreshold = Math.max(mediumThreshold, analysis.gapScore)
    mediumCount++
  }

  return { lowThreshold, mediumThreshold }
}