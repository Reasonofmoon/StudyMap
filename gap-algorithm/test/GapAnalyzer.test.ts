/**
 * EduOntology Gap Analyzer Tests
 * Gap 알고리즘의 기능과 성능을 검증하는 테스트 파일
 */

import { GapAnalyzer, GapAnalysisResult } from '../GapAnalyzer'
import { PathFinder } from '../PathFinder'
import { LearningNode, Layer, UserProgress } from '../types'

describe('GapAnalyzer', () => {
  // 테스트용 학습 노드 데이터
  const testNodes: LearningNode[] = [
    // L1 - Elementary
    {
      id: 'basic_vocabulary',
      type: 'vocabulary',
      term: 'basic',
      difficulty: 1,
      prerequisites: [],
      dependencies: [],
      layer: 'L1',
      timeEstimate: 30,
    },
    {
      id: 'elementary_concept',
      type: 'theme',
      name: 'elementary_concept',
      difficulty: 2,
      prerequisites: ['basic_vocabulary'],
      dependencies: [],
      layer: 'L1',
      timeEstimate: 45,
    },
    // L2 - Middle
    {
      id: 'intermediate_vocabulary',
      type: 'vocabulary',
      term: 'intermediate',
      difficulty: 5,
      prerequisites: ['basic_vocabulary'],
      dependencies: [],
      layer: 'L2',
      timeEstimate: 60,
    },
    {
      id: 'middle_concept',
      type: 'theme',
      name: 'middle_concept',
      difficulty: 6,
      prerequisites: ['elementary_concept', 'intermediate_vocabulary'],
      dependencies: [],
      layer: 'L2',
      timeEstimate: 90,
    },
    // L3 - College
    {
      id: 'advanced_vocabulary',
      type: 'vocabulary',
      term: 'advanced',
      difficulty: 9,
      prerequisites: ['intermediate_vocabulary'],
      dependencies: [],
      layer: 'L3',
      timeEstimate: 120,
    },
    {
      id: 'college_concept',
      type: 'theme',
      name: 'college_concept',
      difficulty: 10,
      prerequisites: ['middle_concept', 'advanced_vocabulary'],
      dependencies: [],
      layer: 'L3',
      timeEstimate: 180,
    },
  ]

  // 테스트용 사용자 진도 데이터
  const testUserProgress = new Map<string, number>([
    ['basic_vocabulary', 0.9],  // 기초 어휘는 잘 알고 있음
    ['elementary_concept', 0.7],  // 초급 개념은 어느 정도 알고 있음
    ['intermediate_vocabulary', 0.3],  // 중간 어휘는 잘 모름
  ])

  let gapAnalyzer: GapAnalyzer

  beforeEach(() => {
    gapAnalyzer = new GapAnalyzer(testNodes, testUserProgress)
  })

  describe('Gap Score Calculation', () => {
    test('should calculate gap score for L1 to L3 transition', () => {
      const result = gapAnalyzer.analyzeGap('college_concept')

      expect(result.targetNode.id).toBe('college_concept')
      expect(result.gapScore).toBeGreaterThan(0)
      expect(result.gapScore).toBeLessThanOrEqual(100)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    test('should have lower gap score for L1 to L2 transition', () => {
      const result1 = gapAnalyzer.analyzeGap('college_concept')
      const result2 = gapAnalyzer.analyzeGap('middle_concept')

      expect(result2.gapScore).toBeLessThan(result1.gapScore)
    })

    test('should have zero gap for mastered node', () => {
      const result = gapAnalyzer.analyzeGap('basic_vocabulary')

      expect(result.gapScore).toBe(0)
      expect(result.missingPrerequisites).toHaveLength(0)
    })
  })

  describe('Prerequisite Analysis', () => {
    test('should identify missing prerequisites correctly', () => {
      const result = gapAnalyzer.analyzeGap('college_concept')

      // college_concept의 선수 조건은 middle_concept와 advanced_vocabulary
      expect(result.missingPrerequisites).toHaveLength(2)
      const missingIds = result.missingPrerequisites.map(n => n.id)
      expect(missingIds).toContain('middle_concept')
      expect(missingIds).toContain('advanced_vocabulary')
    })

    test('should sort prerequisites by difficulty', () => {
      const result = gapAnalyzer.analyzeGap('college_concept')
      const prerequisites = result.missingPrerequisites

      // 난이도 순으로 정렬되어 있어야 함
      for (let i = 0; i < prerequisites.length - 1; i++) {
        expect(prerequisites[i].difficulty).toBeLessThanOrEqual(
          prerequisites[i + 1].difficulty
        )
      }
    })
  })

  describe('Learning Path Finding', () => {
    test('should find optimal path from L1 to L3', () => {
      const result = gapAnalyzer.analyzeGap('college_concept')

      expect(result.recommendedPath).toHaveLengthGreaterThan(0)
      expect(result.estimatedTime).toBeGreaterThan(0)

      // 경로가 유효한지 확인 (연결성 검증)
      for (let i = 0; i < result.recommendedPath.length - 1; i++) {
        const current = result.recommendedPath[i]
        const next = result.recommendedPath[i + 1]

        // 다음 노드의 선수 조건에 현재 노드가 포함되어야 함
        const isPrerequisite = next.prerequisites.includes(current.id)
        const isDependency = current.dependencies.includes(next.id)

        expect(isPrerequisite || isDependency).toBe(true)
      }
    })

    test('should generate different paths for different targets', () => {
      const result1 = gapAnalyzer.analyzeGap('middle_concept')
      const result2 = gapAnalyzer.analyzeGap('college_concept')

      expect(result1.recommendedPath).not.toEqual(result2.recommendedPath)
      expect(result1.estimatedTime).toBeLessThan(result2.estimatedTime)
    })
  })

  describe('Multiple Gap Analysis', () => {
    test('should analyze multiple targets and sort by gap score', () => {
      const targetIds = ['college_concept', 'middle_concept', 'advanced_vocabulary']
      const analyses = gapAnalyzer.analyzeMultipleGaps(targetIds)

      expect(analyses).toHaveLength(3)

      // Gap 점수 내림차순 정렬 확인
      for (let i = 0; i < analyses.length - 1; i++) {
        expect(analyses[i].gapScore).toBeGreaterThanOrEqual(analyses[i + 1].gapScore)
      }

      // 모든 분석에 대한 유효성 검증
      analyses.forEach(analysis => {
        expect(analysis.targetNodeId).toBeOneOf(targetIds)
        expect(analysis.gapScore).toBeGreaterThan(0)
        expect(['low', 'medium', 'high']).toContain(analysis.gapLevel)
      })
    })
  })

  describe('Gap Metrics', () => {
    test('should collect gap metrics correctly', () => {
      const targetIds = testNodes.map(n => n.id)
      const metrics = gapAnalyzer.collectGapMetrics(targetIds)

      expect(metrics.totalGapScore).toBeGreaterThan(0)
      expect(metrics.averageGapScore).toBeGreaterThan(0)
      expect(metrics.gapDistribution).toHaveProperty('low')
      expect(metrics.gapDistribution).toHaveProperty('medium')
      expect(metrics.gapDistribution).toHaveProperty('high')
      expect(metrics.mostCommonGaps).toHaveLengthLessThanOrEqual(10)
    })
  })

  describe('Edge Cases', () => {
    test('should handle non-existent node gracefully', () => {
      expect(() => {
        gapAnalyzer.analyzeGap('non_existent_node')
      }).toThrow()
    })

    test('should handle empty user progress', () => {
      const emptyProgress = new Map<string, number>()
      const analyzer = new GapAnalyzer(testNodes, emptyProgress)
      const result = analyzer.analyzeGap('college_concept')

      expect(result.gapScore).toBeGreaterThan(0)
      expect(result.missingPrerequisites).toHaveLengthGreaterThan(0)
    })

    test('should handle nodes with no prerequisites', () => {
      const result = gapAnalyzer.analyzeGap('basic_vocabulary')

      expect(result.missingPrerequisites).toHaveLength(0)
      expect(result.recommendedPath).toHaveLengthGreaterThan(0)
    })
  })

  describe('Performance', () => {
    test('should analyze gaps efficiently', () => {
      const startTime = performance.now()
      const result = gapAnalyzer.analyzeGap('college_concept')
      const endTime = performance.now()

      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(1000) // 1초 이내 완료
      expect(result.gapScore).toBeGreaterThan(0)
    })

    test('should handle large graph efficiently', () => {
      // 큰 그래프 데이터 생성 (100개 노드)
      const largeNodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node_${i}`,
        type: i % 3 === 0 ? 'vocabulary' : i % 3 === 1 ? 'theme' : 'passage',
        term: `term_${i}`,
        difficulty: Math.floor(Math.random() * 10) + 1,
        prerequisites: i > 0 ? [`node_${i - 1}`] : [],
        dependencies: [],
        layer: i < 33 ? 'L1' : i < 66 ? 'L2' : 'L3',
        timeEstimate: 30 + Math.random() * 120,
      }))

      const largeProgress = new Map(
        largeNodes.map(node => [node.id, Math.random()])
      )

      const analyzer = new GapAnalyzer(largeNodes, largeProgress)
      const startTime = performance.now()

      const result = analyzer.analyzeGap('node_99')

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(executionTime).toBeLessThan(5000) // 5초 이내
      expect(result.gapScore).toBeGreaterThan(0)
    })
  })

  describe('Confidence Calculation', () => {
    test('should calculate confidence based on gap score and prerequisites', () => {
      const result1 = gapAnalyzer.analyzeGap('college_concept')
      const result2 = gapAnalyzer.analyzeGap('basic_vocabulary')

      // Gap 점수가 낮고 선수 조건이 없을 때 신뢰도가 높아야 함
      expect(result2.confidence).toBeGreaterThan(result1.confidence)
      expect(result2.confidence).toBeGreaterThan(0.8)
    })
  })

  describe('Time Estimation', () => {
    test('should estimate learning time accurately', () => {
      const result = gapAnalyzer.analyzeGap('college_concept')
      const expectedMinTime = result.recommendedPath.reduce((total, node) => {
        return total + (node.timeEstimate || 30)
      }, 0)

      // 예상 시간은 최소 시간보다 커야 함 (마스터리 고려)
      expect(result.estimatedTime).toBeGreaterThan(expectedMinTime * 0.5)
      expect(result.estimatedTime).toBeLessThan(expectedMinTime * 2)
    })
  })
})

describe('PathFinder Integration', () => {
  const testNodes: LearningNode[] = [
    {
      id: 'start',
      type: 'vocabulary',
      term: 'start',
      difficulty: 1,
      prerequisites: [],
      dependencies: [],
      layer: 'L1',
      timeEstimate: 30,
    },
    {
      id: 'middle',
      type: 'vocabulary',
      term: 'middle',
      difficulty: 5,
      prerequisites: ['start'],
      dependencies: [],
      layer: 'L2',
      timeEstimate: 60,
    },
    {
      id: 'end',
      type: 'vocabulary',
      term: 'end',
      difficulty: 10,
      prerequisites: ['middle'],
      dependencies: [],
      layer: 'L3',
      timeEstimate: 90,
    },
  ]

  const testProgress = new Map<string, number>([
    ['start', 0.9],
    ['middle', 0.1],
    ['end', 0.0],
  ])

  test('should find optimal path with A* algorithm', () => {
    const pathFinder = new PathFinder(testNodes, testProgress)
    const result = pathFinder.findOptimalPath('start', 'end')

    expect(result.path).toHaveLengthGreaterThan(0)
    expect(result.path[0].id).toBe('start')
    expect(result.path[result.path.length - 1].id).toBe('end')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.totalCost).toBeGreaterThan(0)
  })
})