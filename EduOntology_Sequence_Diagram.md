# EduOntology Sequence Diagram

## 개요
EduOntology 플랫폼의 데이터 모델링을 위한 시퀀스 다이어그램입니다. Neo4j 그래프 데이터베이스의 핵심 노드와 관계 구조를 정의합니다.

## 노드 (Nodes)

### 1. Vocabulary (어휘 노드)
```mermaid
classDiagram
    class Vocabulary {
        +String id: UUID
        +String term: String
        +String definition: String
        +String partOfSpeech: String
        +Integer difficultyLevel: Integer
        +String exampleSentence: String
        +String[] synonyms: String[]
        +String[] antonyms: String[]
        +Date createdAt: DateTime
        +Date updatedAt: DateTime
    }
```

**속성 설명**:
- `id`: 고유 식별자 (UUID)
- `term`: 어휘 항목
- `definition`: 정의
- `partOfSpeech`: 품사
- `difficultyLevel`: 난이도 등급 (1-10)
- `exampleSentence`: 예시 문장
- `synonyms/antonyms`: 동의어/반의어
- `createdAt/updatedAt`: 생성/수정 시간

### 2. Passage (문단 노드)
```mermaid
classDiagram
    class Passage {
        +String id: UUID
        +String title: String
        +String content: String
        +Integer readingLevel: Integer
        +Integer wordCount: Integer
        +String genre: String
        +String[] topics: String[]
        +Date publishedAt: DateTime
        +String source: String
    }
```

**속성 설명**:
- `id`: 고유 식별자 (UUID)
- `title`: 제목
- `content`: 내용
- `readingLevel`: 독해 수준 등급
- `wordCount`: 단어 수
- `genre`: 장르
- `topics`: 주제 목록
- `publishedAt`: 발행일
- `source`: 출처

### 3. Theme (주제 노드)
```mermaid
classDiagram
    class Theme {
        +String id: UUID
        +String name: String
        +String description: String
        +String category: String
        +Integer complexity: Integer
        +String[] keywords: String[]
        +Date createdAt: DateTime
        +Date updatedAt: DateTime
    }
```

**속성 설명**:
- `id`: 고유 식별자 (UUID)
- `name`: 주제명
- `description`: 설명
- `category`: 카테고리
- `complexity`: 복잡도 등급
- `keywords`: 키워드 목록
- `createdAt/updatedAt`: 생성/수정 시간

## 관계 (Relationships)

### 1. APPEARS_IN (등장 관계)
```mermaid
classDiagram
    Vocabulary --> APPEARS_IN --> Passage
    Theme --> APPEARS_IN --> Passage

    class APPEARS_IN {
        +String id: UUID
        +Integer frequency: Integer
        +Integer position: Integer
        +Date discoveredAt: DateTime
    }
```

**관계 설명**:
- `Vocabulary → Passage`: 특정 어휘가 문단에 등장
- `Theme → Passage`: 특정 주제가 문단에 포함
- `frequency`: 등장 빈도
- `position`: 첫 등장 위치
- `discoveredAt`: 발견 시간

### 2. PREREQUISITE (선수 관계)
```mermaid
classDiagram
    Vocabulary - PREREQUISITE -> Vocabulary
    Vocabulary - PREREQUISITE -> Theme
    Theme - PREREQUISITE -> Theme

    class PREREQUISITE {
        +String id: UUID
        +String relationshipType: String
        +Integer confidence: Integer
        +Boolean mandatory: Boolean
        +Date validatedAt: DateTime
    }
```

**관계 설명**:
- `Vocabulary → Vocabulary`: 선수 어휘 관계 (예: '기초' → '고급')
- `Vocabulary → Theme`: 어휘-주제 선수 관계
- `Theme → Theme`: 주제 간 계층적 관계
- `relationshipType`: 관계 유형 (PRECEDES, REQUIRES, ENHANCES)
- `confidence`: 신뢰도 (0-100)
- `mandatory`: 필수 여부
- `validatedAt`: 검증 시간

## 완전한 시퀀스 다이어그램

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Neo4j
    participant DataProcessor

    Note over User,DataProcessor: 학습 콘텐츠 생성 시나리오

    User->>API: 새 문단 생성 요청
    API->>Neo4j: 1. 텍스트 분석 실행
    Neo4j->>DataProcessor: 2. 어휘 추출 요청
    DataProcessor->>Neo4j: 3. Vocabulary 노드 검색
    Neo4j-->>DataProcessor: 추출된 어휘 목록
    DataProcessor->>Neo4j: 4. APPEARS_IN 관계 생성
    Neo4j->>DataProcessor: 5. 주제 식별 요청
    DataProcessor->>Neo4j: 6. Theme 노드 검색
    Neo4j-->>DataProcessor: 관련 주제 목록
    DataProcessor->>Neo4j: 7. APPEARS_IN 관계 생성
    Neo4j->>API: 8. 데이터 저장 완료
    API-->>User: 생성 완료 응답
    API->>Neo4j: 9. PREREQUISITE 관계 업데이트
    Neo4j-->>API: 업데이트 완료

    Note over User,Neo4j: 학습 경로 추천 시나리오

    User->>API: 개인화된 학습 경로 요청
    API->>Neo4j: 1. 현재 학습 수준 조회
    Neo4j-->>API: Vocabulary/Passage 데이터
    API->>Neo4j: 2. PREREQUISITE 관계 탐색
    Neo4j->>Neo4j: 3. 그래프 순회 알고리즘
    Neo4j-->>API: 추천 경로 목록
    API->>Neo4j: 4. Gap 분석 요청
    Neo4j->>Neo4j: 5. 3-Layer Map 비교
    Neo4j-->>API: Gap 분석 결과
    API-->>User: 학습 경로 응답
```

## 3-Layer 구조

### 1. 초등 (Elementary) Layer
```mermaid
graph TD
    subgraph "Elementary Layer"
        E1[Vocabulary<br/>Basic Terms]
        E2[Passage<br/>Simple Stories]
        E3[Theme<br/>Fundamental Concepts]
    end
```

**특징**:
- 난이도: 1-3
- 어휘: 일상생활 기초 용어
- 독해 수준: 초등학생 수준
- 주제: 기본 개념

### 2. 중등 (Middle) Layer
```mermaid
graph TD
    subgraph "Middle Layer"
        M1[Vocabulary<br/>Academic Terms]
        M2[Passage<br/>Essays & Articles]
        M3[Theme<br/>Advanced Concepts]
    end
```

**특징**:
- 난이도: 4-7
- 어휘: 학술 용어
- 독해 수준: 중학생 수준
- 주제: 복잡한 개념

### 3. 수능 (College) Layer
```mermaid
graph TD
    subgraph "College Layer"
        C1[Vocabulary<br/>Specialized Terms]
        C2[Passage<br/>Academic Papers]
        C3[Theme<br/>Expert-Level Topics]
    end
```

**특징**:
- 난이도: 8-10
- 어휘: 전문 용어
- 독해 수준: 고등/대학 수준
- 주제: 전문 수준 주제

## Gap 식별 알고리즘 개요

```mermaid
flowchart TD
    A[현재 학습 데이터] --> B[3-Layer Map 생성]
    B --> C[목표 수준 설정]
    C --> D[필요 어휘 식별]
    D --> E[선수 조건 확인]
    E --> F[Gap 분석]
    F --> G[추천 경로 생성]
```

## 데이터 일관성 검증

### 1. 인그레스(Ingess) 검증
```mermaid
sequenceDiagram
    participant ValidationService
    participant Neo4j

    ValidationService->>Neo4j: 신규 데이터 검증 요청
    Neo4j->>Neo4j: 1. 데이터 무결성 확인
    Neo4j->>Neo4j: 2. 관계 일관성 검사
    Neo4j->>Neo4j: 3. 중복 데이터 확인
    Neo4j-->>ValidationService: 검증 결과
```

### 2. 이그레스(Egress) 검증
```mermaid
sequenceDiagram
    participant API
    participant Cache

    API->>Cache: 데이터 요청
    Cache-->>API: 캐시된 데이터
    API->>Neo4j: 새로고침 확인
    Neo4j-->>API: 최신 데이터
    API-->>User: 최신 응답
```

## 성능 최적화 전략

### 1. 인덱싱 전략
```
CREATE INDEX vocab_term_idx FOR (v:Vocabulary) ON (v.term)
CREATE INDEX theme_name_idx FOR (t:Theme) ON (t.name)
CREATE INDEX passage_title_idx FOR (p:Passage) ON (p.title)
```

### 2. 쿼리 최적화
```cypher
// 선수 관계 검색 쿼리
MATCH (target)-[:PREREQUISITE]->(prerequisite)
WHERE target.id = $targetId
RETURN prerequisite
ORDER BY prerequisite.difficultyLevel ASC
```

### 3. 배치 처리
```cypher
// 대량 데이터 처리
LOAD CSV WITH HEADERS FROM 'file:///vocabularies.csv' AS row
MERGE (v:Vocabulary {id: row.id})
SET v.term = row.term,
    v.definition = row.definition,
    v.partOfSpeech = row.partOfSpeech
```

## 다이어그램 상태

- **작성 완료**: ✓
- **검증 필요**: Neo4j 쿼리 실제 테스트
- **업데이트 필요**: 구현 후 성능 데이터 반영

## 다음 단계

1. Editor: Next.js 14 + Neo4j 연동 모듈 개발 (Task #3)
2. Browser: D3.js 시각화 테스트 시나리오 수립 (Task #4)
3. Protocol: EDU_ONTOLOGY_PROTOCOL.md 작성 (Task #5)