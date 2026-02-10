/**
 * EduOntology Path Finder
 * 최적 학습 경로 찾기 알고리즘 구현
 */

import { LearningNode, Layer, PathResult, GapAnalysisOptions } from './types'

export interface PathNode {
  node: LearningNode
  gScore: number  // 시작 노드까지의 실제 비용
  hScore: number  // 목표 노드까지의 추정 비용
  fScore: number  // 총 비용 (gScore + hScore)
  previous: PathNode | null
  open: boolean
}

export interface HeuristicConfig {
  mode: 'linear' | 'exponential' | 'logarithmic'
  difficultyWeight: number
  layerWeight: number
  masteryBonus: number
}

export class PathFinder {
  private nodes: Map<string, LearningNode>
  private userProgress: Map<string, number>
  private heuristicConfig: HeuristicConfig

  constructor(
    nodes: LearningNode[],
    userProgress: Map<string, number>,
    heuristicConfig: Partial<HeuristicConfig> = {}
  ) {
    this.nodes = new Map(nodes.map(node => [node.id, node]))
    this.userProgress = new Map(userProgress)
    this.heuristicConfig = {
      mode: 'linear',
      difficultyWeight: 1.0,
      layerWeight: 1.0,
      masteryBonus: 0.5,
      ...heuristicConfig
    }
  }

  /**
   * A* 알고리즘으로 최적 경로 찾기
   */
  findOptimalPath(
    fromNodeId: string,
    toNodeId: string,
    options: GapAnalysisOptions = {}
  ): PathResult {
    const {
      maxPathLength = 20,
      includeAlternatives = false,
      confidenceThreshold = 0.5,
      timeLimit = 30000, // 30초
    } = options

    const startTime = performance.now()
    const allPaths: PathResult[] = []

    // 경로 찾기 시작
    const mainPath = this.aStar(fromNodeId, toNodeId, maxPathLength, timeLimit, startTime)

    if (mainPath) {
      allPaths.push(mainPath)
    }

    // 대체 경로 찾기 (옵션에 따라)
    if (includeAlternatives) {
      const alternativePaths = this.findAlternativePaths(
        fromNodeId,
        toNodeId,
        maxPathLength,
        timeLimit,
        startTime
      )
      allPaths.push(...alternativePaths)
    }

    // 가장 좋은 경로 선택
    const bestPath = this.selectBestPath(allPaths, confidenceThreshold)

    return {
      path: bestPath?.path || [],
      totalCost: bestPath?.totalCost || 0,
      totalTime: bestPath?.totalTime || 0,
      confidence: bestPath?.confidence || 0,
      alternativePaths: allPaths.filter(p => p !== bestPath).map(p => p.path),
    }
  }

  /**
   * A* 알고리즘 구현
   */
  private aStar(
    fromNodeId: string,
    toNodeId: string,
    maxPathLength: number,
    timeLimit: number,
    startTime: number
  ): PathResult | null {
    const openSet = new Map<string, PathNode>()
    const closedSet = new Set<string>()
    const cameFrom = new Map<string, PathNode>()

    // 시작 노드 초기화
    const startNode = this.nodes.get(fromNodeId)
    const endNode = this.nodes.get(toNodeId)

    if (!startNode || !endNode) return null

    const startPathNode: PathNode = {
      node: startNode,
      gScore: 0,
      hScore: this.heuristic(fromNodeId, toNodeId),
      fScore: 0 + this.heuristic(fromNodeId, toNodeId),
      previous: null,
      open: true,
    }

    startPathNode.fScore = startPathNode.gScore + startPathNode.hScore
    openSet.set(fromNodeId, startPathNode)

    let iteration = 0
    while (openSet.size > 0 && performance.now() - startTime < timeLimit) {
      iteration++

      // fScore가 가장 낮은 노드 선택
      const current = this.findLowestFScore(openSet)
      const currentNode = current.node
      current.open = false
      openSet.delete(currentNode.id)

      if (currentNode.id === toNodeId) {
        // 목표 도달
        return this.buildPathResult(cameFrom, current)
      }

      if (closedSet.size >= maxPathLength) {
        break
      }

      closedSet.add(currentNode.id)

      // 인접 노드 탐색
      const neighbors = this.getValidNeighbors(currentNode, closedSet)

      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.id)) continue

        const tentativeGScore = current.gScore + this.calculateTransitionCost(current, neighbor)

        const existingPathNode = openSet.get(neighbor.id)

        if (!existingPathNode || tentativeGScore < existingPathNode.gScore) {
          cameFrom.set(neighbor.id, current)

          const newPathNode: PathNode = {
            node: neighbor,
            gScore: tentativeGScore,
            hScore: this.heuristic(neighbor.id, toNodeId),
            fScore: tentativeGScore + this.heuristic(neighbor.id, toNodeId),
            previous: current,
            open: true,
          }

          openSet.set(neighbor.id, newPathNode)
        }
      }
    }

    // 경로를 찾지 못한 경우
    return this.buildFallbackPath(fromNodeId, toNodeId)
  }

  /**
   * 대체 경로 찾기
   */
  private findAlternativePaths(
    fromNodeId: string,
    toNodeId: string,
    maxPathLength: number,
    timeLimit: number,
    startTime: number
  ): PathResult[] {
    const alternatives: PathResult[] = []
    const targetNode = this.nodes.get(toNodeId)

    if (!targetNode) return alternatives

    // 다른 접근 방식으로 경로 찾기
    const strategies = [
      this.findViaIntermediate.bind(this),
      this.findViaLayerTransition.bind(this),
      this.findViaDifficultyProgression.bind(this),
    ]

    for (const strategy of strategies) {
      const startTime = performance.now()
      try {
        const alternative = strategy(fromNodeId, toNodeId, maxPathLength, timeLimit, startTime)
        if (alternative) {
          alternatives.push(alternative)
        }
      } catch (error) {
        console.warn('Alternative path strategy failed:', error)
      }
    }

    return alternatives
  }

  /**
   * 중간 노드를 통한 경로 찾기
   */
  private findViaIntermediate(
    fromNodeId: string,
    toNodeId: string,
    maxPathLength: number,
    timeLimit: number,
    startTime: number
  ): PathResult | null {
    const targetNode = this.nodes.get(toNodeId)
    if (!targetNode) return null

    // 적합한 중간 노드 찾기
    const intermediateNodes = Array.from(this.nodes.values())
      .filter(node => {
        return (
          node.id !== fromNodeId &&
          node.id !== toNodeId &&
          this.isSuitableIntermediate(node, targetNode)
        )
      })
      .sort((a, b) => {
        const aScore = this.heuristic(fromNodeId, a.id) + this.heuristic(a.id, toNodeId)
        const bScore = this.heuristic(fromNodeId, b.id) + this.heuristic(b.id, toNodeId)
        return aScore - bScore
      })
      .slice(0, 3)  // 상위 3개만 시도

    for (const intermediate of intermediateNodes) {
      try {
        const path1 = this.aStar(fromNodeId, intermediate.id, maxPathLength, timeLimit / 2, startTime)
        const path2 = this.aStar(intermediate.id, toNodeId, maxPathLength, timeLimit / 2, startTime)

        if (path1 && path2) {
          return {
            path: [...path1.path, ...path2.path.slice(1)],
            totalCost: path1.totalCost + path2.totalCost,
            totalTime: path1.totalTime + path2.totalTime,
            confidence: (path1.confidence + path2.confidence) / 2,
            alternativePaths: [],
          }
        }
      } catch (error) {
        continue
      }
    }

    return null
  }

  /**
   * 레이어 전환을 통한 경로 찾기
   */
  private findViaLayerTransition(
    fromNodeId: string,
    toNodeId: string,
    maxPathLength: number,
    timeLimit: number,
    startTime: number
  ): PathResult | null {
    const startNode = this.nodes.get(fromNodeId)
    const endNode = this.nodes.get(toNodeId)

    if (!startNode || !endNode) return null

    const layerSequence = this.getOptimalLayerSequence(startNode.layer, endNode.layer)
    let currentPath: PathNode[] = [startNode]

    for (const layer of layerSequence) {
      const bridgeNodes = Array.from(this.nodes.values())
        .filter(node => node.layer === layer && node.id !== currentPath[currentPath.length - 1].id)

      if (bridgeNodes.length === 0) continue

      // 가장 적합한 다리 노드 찾기
      const bestBridge = bridgeNodes.reduce((best, node) => {
        const cost = this.calculateTransitionCost(
          currentPath[currentPath.length - 1],
          node
        )
        return cost < best.cost ? { node, cost } : best
      }, { node: null as LearningNode | null, cost: Infinity })

      if (bestBridge.node) {
        currentPath.push(bestBridge.node)
      }
    }

    // 마지막으로 목표 노드 추가
    if (currentPath[currentPath.length - 1].id !== toNodeId) {
      currentPath.push(endNode)
    }

    return this.buildPathFromNodeList(currentPath)
  }

  /**
   * 난이도 진행을 통한 경로 찾기
   */
  private findViaDifficultyProgression(
    fromNodeId: string,
    toNodeId: string,
    maxPathLength: number,
    timeLimit: number,
    startTime: number
  ): PathResult | null {
    const startNode = this.nodes.get(fromNodeId)
    const endNode = this.nodes.get(toNodeId)

    if (!startNode || !endNode) return null

    // 난이도 순으로 정렬된 노드 경로 찾기
    const sortedNodes = Array.from(this.nodes.values())
      .filter(node => {
        const startDiff = Math.abs(node.difficulty - startNode.difficulty)
        const endDiff = Math.abs(node.difficulty - endNode.difficulty)
        return startDiff <= 3 && endDiff <= 3  // 시작과 목표로부터 3 이내
      })
      .sort((a, b) => {
        // 난이도 진행 순서로 정렬
        const aProgress = this.calculateProgress(a, startNode, endNode)
        const bProgress = this.calculateProgress(b, startNode, endNode)
        return bProgress - aProgress
      })

    // 경로 구성
    const path: PathNode[] = [startNode]
    const visited = new Set([fromNodeId])

    for (const node of sortedNodes) {
      if (visited.has(node.id) || path.length >= maxPathLength) continue

      const lastNode = path[path.length - 1]
      const transitionCost = this.calculateTransitionCost(lastNode, node)

      if (transitionCost <= 20) {  // 합리적인 전환 비용
        path.push(node)
        visited.add(node.id)
      }
    }

    // 목표 노드가 경로에 없으면 추가
    if (path[path.length - 1].id !== toNodeId) {
      path.push(endNode)
    }

    return this.buildPathFromNodeList(path)
  }

  /**
   * 유효한 이웃 노드 찾기
   */
  private getValidNeighbors(node: LearningNode, closedSet: Set<string>): LearningNode[] {
    const neighbors: LearningNode[] = []

    // 선수 조건 이웃
    for (const prereqId of node.prerequisites) {
      const prereqNode = this.nodes.get(prereqId)
      if (prereqNode && !closedSet.has(prereqId)) {
        neighbors.push(prereqNode)
      }
    }

    // 의존 노드 이웃
    for (const otherNode of this.nodes.values()) {
      if (
        otherNode.id !== node.id &&
        !closedSet.has(otherNode.id) &&
        otherNode.prerequisites.includes(node.id)
      ) {
        neighbors.push(otherNode)
      }
    }

    // 난이도 기반 필터링
    const userMastery = this.userProgress.get(node.id) || 0
    const difficultyThreshold = 1 + (1 - userMastery) * 2

    return neighbors.filter(neighbor => {
      const difficultyDiff = Math.abs(neighbor.difficulty - node.difficulty)
      return difficultyDiff <= difficultyThreshold
    })
  }

  /**
   * 휴리스틱 함수
   */
  private heuristic(fromNodeId: string, toNodeId: string): number {
    const fromNode = this.nodes.get(fromNodeId)
    const toNode = this.nodes.get(toNodeId)

    if (!fromNode || !toNode) return 0

    let score = 0

    // 난이도 차이
    const difficultyDiff = toNode.difficulty - fromNode.difficulty
    score += Math.abs(difficultyDiff) * this.heuristicConfig.difficultyWeight

    // 레이어 차이
    const layerDiff = this.getLayerDistance(fromNode.layer, toNode.layer)
    score += layerDiff * this.heuristicConfig.layerWeight

    // 사용자 마스터리 보너스
    const fromMastery = this.userProgress.get(fromNodeId) || 0
    const toMastery = this.userProgress.get(toNodeId) || 0
    score -= (fromMastery - toMastery) * this.heuristicConfig.masteryBonus

    // 휴리스틱 모드 적용
    switch (this.heuristicConfig.mode) {
      case 'exponential':
        score = Math.exp(score / 10)
        break
      case 'logarithmic':
        score = Math.log(1 + score)
        break
      case 'linear':
      default:
        // 그대로 사용
        break
    }

    return score
  }

  /**
   * 레이어 간 거리 계산
   */
  private getLayerDistance(layer1: Layer, layer2: Layer): number {
    const layerOrder: Record<Layer, number> = { L1: 1, L2: 2, L3: 3 }
    return Math.abs(layerOrder[layer2] - layerOrder[layer1])
  }

  /**
   * 전환 비용 계산
   */
  private calculateTransitionCost(fromNode: LearningNode, toNode: LearningNode): number {
    let cost = 0

    // 난이도 비용
    const difficultyDiff = toNode.difficulty - fromNode.difficulty
    cost += Math.max(0, difficultyDiff) * 5

    // 레이어 비용
    cost += this.getLayerDistance(fromNode.layer, toNode.layer) * 10

    // 사용자 마스터리 고려
    const fromMastery = this.userProgress.get(fromNode.id) || 0
    const toMastery = this.userProgress.get(toNode.id) || 0
    cost += (1 - fromMastery) * 5

    // 선수 조건 비용
    if (!fromNode.prerequisites.includes(toNode.id)) {
      cost += 15  // 선수 조건 관계가 아닌 경우 추가 비용
    }

    return cost
  }

  /**
   * 가장 낮은 fScore 찾기
   */
  private findLowestFScore(openSet: Map<string, PathNode>): PathNode {
    let lowestFScore = Infinity
    let lowestNode: PathNode | null = null

    for (const node of openSet.values()) {
      if (node.open && node.fScore < lowestFScore) {
        lowestFScore = node.fScore
        lowestNode = node
      }
    }

    if (!lowestNode) {
      // openSet에서 임의의 노드 선택
      const firstNode = openSet.values().next().value
      if (firstNode) firstNode.open = true
      return firstNode!
    }

    return lowestNode
  }

  /**
   * 경로 결과 구축
   */
  private buildPathResult(cameFrom: Map<string, PathNode>, current: PathNode): PathResult {
    const pathNodes: PathNode[] = []
    let pathNode: PathNode | null = current

    while (pathNode) {
      pathNodes.unshift(pathNode)
      pathNode = pathNode.previous
    }

    const path = pathNodes.map(pn => pn.node)

    return {
      path,
      totalCost: current.gScore,
      totalTime: this.calculateTotalTime(path),
      confidence: this.calculatePathConfidence(path),
      alternativePaths: [],
    }
  }

  /**
   * 노드 리스트로부터 경로 구축
   */
  private buildPathFromNodeList(pathNodes: LearningNode[]): PathResult {
    const path: PathNode[] = pathNodes.map(node => ({
      node,
      gScore: 0,
      hScore: 0,
      fScore: 0,
      previous: null,
      open: false,
    }))

    // gScore 계산
    for (let i = 1; i < path.length; i++) {
      const cost = this.calculateTransitionCost(path[i - 1].node, path[i].node)
      path[i].gScore = path[i - 1].gScore + cost
      path[i].fScore = path[i].gScore
    }

    return {
      path: path.map(p => p.node),
      totalCost: path[path.length - 1].gScore,
      totalTime: this.calculateTotalTime(path.map(p => p.node)),
      confidence: this.calculatePathConfidence(path.map(p => p.node)),
      alternativePaths: [],
    }
  }

  /**
   * 폴백 경로 구축
   */
  private buildFallbackPath(fromNodeId: string, toNodeId: string): PathResult {
    const startNode = this.nodes.get(fromNodeId)
    const endNode = this.nodes.get(toNodeId)

    if (!startNode || !endNode) {
      return {
        path: [],
        totalCost: 0,
        totalTime: 0,
        confidence: 0,
        alternativePaths: [],
      }
    }

    return {
      path: [startNode, endNode],
      totalCost: 100,
      totalTime: 120,
      confidence: 0.3,
      alternativePaths: [],
    }
  }

  /**
   * 최적 경로 선택
   */
  private selectBestPath(paths: PathResult[], confidenceThreshold: number): PathResult | null {
    if (paths.length === 0) return null

    return paths
      .filter(path => path.confidence >= confidenceThreshold)
      .sort((a, b) => {
        // 우선순위: 1) confidence, 2) totalCost, 3) totalTime
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence
        }
        if (a.totalCost !== b.totalCost) {
          return a.totalCost - b.totalCost
        }
        return a.totalTime - b.totalTime
      })[0] || paths[0]
  }

  /**
   * 시간 계산
   */
  private calculateTotalTime(path: LearningNode[]): number {
    return path.reduce((total, node) => {
      const baseTime = node.difficulty * 15  // 기본 시간
      const mastery = this.userProgress.get(node.id) || 0
      const adjustedTime = baseTime * (1 - mastery * 0.5)
      return total + adjustedTime
    }, 0)
  }

  /**
   * 경로 신뢰도 계산
   */
  private calculatePathConfidence(path: LearningNode[]): number {
    if (path.length <= 1) return 0

    let totalConfidence = 0
    let validSteps = 0

    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1]
      const to = path[i]

      // 난이도 비율 계산
      const difficultyRatio = to.difficulty / from.difficulty
      if (difficultyRatio <= 2) {  // 2배 이상 난이도 상승은 감소
        totalConfidence += 0.8
      } else {
        totalConfidence += 0.5
      }

      // 마스터리 고려
      const fromMastery = this.userProgress.get(from.id) || 0
      if (fromMastery >= 0.7) {
        totalConfidence += 0.2
      }

      validSteps++
    }

    return validSteps > 0 ? totalConfidence / validSteps : 0
  }

  /**
   * 적합한 중간 노드 판단
   */
  private isSuitableIntermediate(node: LearningNode, target: LearningNode): boolean {
    const toTargetDistance = this.heuristic(node.id, target.id)
    const fromStartDistance = this.heuristic('start', node.id)

    return toTargetDistance < fromStartDistance
  }

  /**
   * 난이도 진행도 계산
   */
  private calculateProgress(node: LearningNode, start: LearningNode, end: LearningNode): number {
    const startDiff = node.difficulty - start.difficulty
    const totalDiff = end.difficulty - start.difficulty

    if (totalDiff === 0) return 0.5  // 같은 난이도
    return Math.max(0, Math.min(1, startDiff / totalDiff))
  }

  /**
   * 최적 레이어 시퀀스 계산
   */
  private getOptimalLayerSequence(startLayer: Layer, endLayer: Layer): Layer[] {
    if (startLayer === endLayer) return [startLayer]

    const layerOrder: Layer[] = ['L1', 'L2', 'L3']
    const startIndex = layerOrder.indexOf(startLayer)
    const endIndex = layerOrder.indexOf(endLayer)

    if (startIndex < endIndex) {
      return layerOrder.slice(startIndex, endIndex + 1)
    } else {
      return layerOrder.slice(endIndex, startIndex + 1).reverse()
    }
  }
}