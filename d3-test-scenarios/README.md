# D3.js Interactive Map Test Scenarios

## 개요
이 문서는 EduOntology 플랫폼의 D3.js 기반 상호작용 맵 시각화에 대한 테스트 시나리오를 정의합니다.

## 테스트 목표

1. **시각화 정확성**: 데이터의 정확한 표현 확인
2. **상호작용**: 사용자 상호작용의 올바른 동작 검증
3. **성능**: 대규모 데이터 처리 효율성 평가
4. **반응성**: 다양한 화면 크기에 대한 대응 능력 검사
5. **사용성**: 직관적인 사용자 경험 확인

## 테스트 환경 설정

### 1. 개발 환경
```typescript
// 테스트용 데이터 생성
const generateTestData = (count: number) => {
  const nodes = Array.from({ length: count }, (_, i) => ({
    id: `node_${i}`,
    type: ['vocabulary', 'theme', 'passage'][Math.floor(Math.random() * 3)],
    term: `term_${i}`,
    difficulty: Math.floor(Math.random() * 10) + 1,
    layer: i < count / 3 ? 'L1' : i < (count * 2) / 3 ? 'L2' : 'L3',
    prerequisites: i > 0 ? [`node_${i - 1}`] : [],
    x: Math.random() * 800,
    y: Math.random() * 600,
  }))

  return nodes
}
```

### 2. 테스트 도구
- **Jest**: 단위 테스트
- **Testing Library**: 컴포넌트 테스트
- **D3.js**: 시각화 라이브러리
- **Puppeteer**: E2E 테스트

## 테스트 시나리오

### 시나리오 1: 기본 시각화 테스트

**목표**: 3-Layer Map의 기본 시각화 기능 검증

**절차**:
1. 테스트 데이터 로드 (50개 노드)
2. SVG 생성 확인
3. 레이어 배치 확인
4. 노드 색상 검증

**예상 결과**:
- SVG 요소가 정확히 생성됨
- L1: 초록색, L2: 파란색, L3: 보라색 배치
- 노드 크기가 난이도에 비례

**검증 항목**:
```typescript
test('should render basic 3-layer map', () => {
  const nodes = generateTestData(50)
  const { container } = render(<LayeredMapVisualization nodes={nodes} />)

  // SVG 요소 확인
  expect(container.querySelector('svg')).toBeInTheDocument()

  // 레이어 배치 확인
  const layerElements = container.querySelectorAll('.layer')
  expect(layerElements).toHaveLength(3)

  // 노드 수 확인
  const nodeElements = container.querySelectorAll('.node')
  expect(nodeElements.length).toBe(50)
})
```

### 시나리오 2: 상호작용 테스트

**목표**: 사용자 상호작용 기능 검증

**절차**:
1. 노드 클릭 이벤트 트리거
2. 드래그 앤 드롭 테스트
3. 줌 인/아웃 기능 테스트
4. 필터 적용 테스트

**예상 결과**:
- 클릭 시 상세 정보 표시
- 드래그로 노드 위치 변경
- 줌으로 확대/축소
- 필터링 시 노드 필터링

**검증 항목**:
```typescript
test('should handle node interactions', async () => {
  const onNodeClick = jest.fn()
  const { container } = render(<LayeredMapVisualization nodes={nodes} onNodeClick={onNodeClick} />)

  // 노드 클릭 테스트
  const node = container.querySelector('.node')
  fireEvent.click(node)

  await waitFor(() => {
    expect(onNodeClick).toHaveBeenCalledWith(expect.any(Object))
  })

  // 드래그 테스트
  fireEvent.dragStart(node)
  fireEvent.dragOver(container)
  fireEvent.drop(container)

  expect(onNodeClick).toHaveBeenCalledTimes(2)
})
```

### 시나리오 3: 성능 테스트

**목표**: 대규모 데이터 처리 성능 평가

**절차**:
1. 성능 테스트 데이터 생성 (100, 500, 1000개 노드)
2. 렌더링 시간 측정
3. 상호작응 반응 시간 측정
4. 메모리 사용량 확인

**예상 결과**:
- 100개: < 1초
- 500개: < 3초
- 1000개: < 5초

**검증 항목**:
```typescript
describe('Performance Tests', () => {
  test('should handle 100 nodes in < 1000ms', () => {
    const start = performance.now()
    const nodes = generateTestData(100)
    const { container } = render(<LayeredMapVisualization nodes={nodes} />)
    const end = performance.now()

    expect(end - start).toBeLessThan(1000)
  })

  test('should handle 1000 nodes in < 5000ms', () => {
    const start = performance.now()
    const nodes = generateTestData(1000)
    const { container } = render(<LayeredMapVisualization nodes={nodes} />)
    const end = performance.now()

    expect(end - start).toBeLessThan(5000)
  })
})
```

### 시나리오 4: 반응형 테스트

**목표**: 다양한 화면 크기에 대한 대응 능력 검사

**절차**:
1. 다양한 화면 크기 시뮬레이션
2. 레이아웃 조정 확인
3. 터치 상호작용 테스트
4. 접근성 검증

**예상 결과**:
- 모든 화면 크기에서 정상 표시
- 터치 장치에서 정상 동작
- 스크린 리더 접근성 보장

**검증 항목**:
```typescript
test('should be responsive', () => {
  const { container, rerender } = render(<LayeredMapVisualization width={800} height={600} />)

  // 화면 크기 변경 테스트
  rerender(<LayeredMapVisualization width={400} height={300} />)

  expect(container.querySelector('svg')).toHaveAttribute('width', '400')
  expect(container.querySelector('svg')).toHaveAttribute('height', '300')
})
```

### 시나리오 5: 데이터 업데이트 테스트

**목표**: 실시간 데이터 업데이트 처리 검증

**절차**:
1. 초기 데이터 렌더링
2. 데이터 추가/삭제 테스트
3. 속성 업데이트 테스트
4. 애니메이션 확인

**예상 결과**:
- 부드러운 데이터 업데이트
- 정확한 상태 유지
- 자연스러운 애니메이션

**검증 항목**:
```typescript
test('should handle data updates', () => {
  const initialNodes = generateTestData(10)
  const { container, rerender } = render(<LayeredMapVisualization nodes={initialNodes} />)

  // 데이터 추가 테스트
  const updatedNodes = [...initialNodes, ...generateTestData(5)]
  rerender(<LayeredMapVisualization nodes={updatedNodes} />)

  expect(container.querySelectorAll('.node')).toHaveLength(15)
})
```

### 시나리오 6: 에러 처리 테스트

**목표**: 오류 상황에 대한 적절한 처리 검증

**절차**:
1. 유효하지 않은 데이터 입력
2. 네트워크 오류 시뮬레이션
3. 메모리 부족 테스트
4. 렌더링 오류 처리

**예상 결과**:
- 오류 메시지 표시
- 애플리케이션 충돌 방지
- 로깅 기능 동작

**검증 항목**:
```typescript
test('should handle errors gracefully', () => {
  // 유효하지 않은 데이터 테스트
  const invalidNodes = [{ ...generateTestData(1)[0], difficulty: 11 }]

  expect(() => {
    render(<LayeredMapVisualization nodes={invalidNodes} />)
  }).not.toThrow()

  // 네트워크 오류 테스트
  console.error = jest.fn()
  const errorNodes = generateTestData(0)
  render(<LayeredMapVisualization nodes={errorNodes} />)

  expect(console.error).toHaveBeenCalled()
})
```

## 자동화 테스트

### 1. 단위 테스트
```typescript
// components/layered-map.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LayeredMapVisualization } from '@/components/LayeredMapVisualization'

describe('LayeredMapVisualization', () => {
  test('renders nodes correctly', () => {
    const nodes = [
      { id: '1', type: 'vocabulary', term: 'test', difficulty: 5, layer: 'L1' }
    ]

    render(<LayeredMapVisualization nodes={nodes} />)

    expect(screen.getByText('test')).toBeInTheDocument()
  })
})
```

### 2. 통합 테스트
```typescript
// tests/integration/map-integration.test.ts
describe('Map Integration Tests', () => {
  test('should update when data changes', async () => {
    const mockData = generateTestData(10)
    const { container, rerender } = render(<LayeredMapVisualization nodes={mockData} />)

    // 데이터 변경
    const updatedData = [...mockData, ...generateTestData(2)]
    rerender(<LayeredMapVisualization nodes={updatedData} />)

    await waitFor(() => {
      expect(container.querySelectorAll('.node')).toHaveLength(12)
    })
  })
})
```

### 3. E2E 테스트
```typescript
// tests/e2e/map-e2e.spec.ts
describe('Map E2E Tests', () => {
  test('user can navigate the map', async () => {
    await page.goto('/map')

    // 노드 클릭
    await page.click('.node')

    // 상세 정보 확인
    await expect(page.locator('.node-details')).toBeVisible()

    // 드래그
    await page.dragAndDrop('.node', '.drop-zone')

    // 위치 변경 확인
    await expect(page.locator('.node')).toHaveClass('moved')
  })
})
```

## 성능 모니터링

### 1. 성능 지표
```typescript
interface PerformanceMetrics {
  renderTime: number
  interactionTime: number
  memoryUsage: number
  frameRate: number
}
```

### 2. 모니터링 코드
```typescript
const monitorPerformance = () => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'map-render') {
        console.log(`Render time: ${entry.duration}ms`)
      }
    }
  })

  observer.observe({ entryTypes: ['measure'] })
}
```

## 테스트 데이터

### 1. 테스트 데이터 생성기
```typescript
const testDataSet = {
  small: generateTestData(50),
  medium: generateTestData(200),
  large: generateTestData(1000),
  edgeCase: [
    { id: 'empty', type: 'vocabulary', term: '', difficulty: 0, layer: 'L1' },
    { id: 'max', type: 'theme', name: 'maximum', difficulty: 10, layer: 'L3' }
  ]
}
```

### 2. 실제 데이터 샘플
```json
{
  "nodes": [
    {
      "id": "vocab_1",
      "type": "vocabulary",
      "term": "fundamental",
      "difficulty": 1,
      "layer": "L1",
      "prerequisites": []
    },
    {
      "id": "theme_1",
      "type": "theme",
      "name": "basic_concepts",
      "difficulty": 2,
      "layer": "L1",
      "prerequisites": ["vocab_1"]
    }
  ]
}
```

## 테스트 실행

### 1. 개발 환경
```bash
# 단위 테스트
npm test

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 성능 테스트
npm run test:performance
```

### 2. CI/CD 통합
```yaml
# .github/workflows/test.yml
name: Map Visualization Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm run test:all
```

## 보고서 생성

### 1. 테스트 결과 요약
```typescript
const generateTestReport = (results: TestResult[]) => {
  return {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    performance: {
      avgRenderTime: calculateAverage(results.map(r => r.renderTime)),
      maxMemoryUsage: Math.max(...results.map(r => r.memoryUsage))
    }
  }
}
```

### 2. 시각화 보고서
```typescript
const report = {
  summary: generateTestReport(testResults),
  charts: {
    performance: renderPerformanceChart(testResults),
    coverage: renderCoverageChart(testResults)
  }
}
```

## 유지보수

### 1. 테스트 업데이트 가이드
- 새로운 기능 추가 시 테스트 케이스 확장
- 성능 문제 발견 시 테스트 조정
- UI 변경 시 시각적 테스트 업데이트

### 2. 자동화 개선
- 테스트 커버리지 지속적 모니터링
- 불필요한 테스트 제거
- 테스트 실행 시간 최적화