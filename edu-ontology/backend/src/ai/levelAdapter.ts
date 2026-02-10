import { Assignment, AssignmentContent, LevelAdapter, AssignmentType } from './types';

// A1 레벨 어댑터: 초급 단순화
export const A1Adapter: LevelAdapter = {
  adapt: (content, level) => {
    return {
      ...content,
      question: simplifyVocabulary(content.question),
      options: content.options?.map(opt => simplifyVocabulary(opt)),
      explanation: simplifyExplanation(content.explanation),
      example: content.example ? simplifyVocabulary(content.example) : undefined
    };
  }
};

// A2 레벨 어댑터: 기초적 복잡성 추가
export const A2Adapter: LevelAdapter = {
  adapt: (content, level) => {
    return {
      ...content,
      question: addBasicContext(content.question),
      options: content.options?.map(opt => addBasicContext(opt)),
      explanation: addBasicExamples(content.explanation),
      example: content.example ? addBasicContext(content.example) : undefined
    };
  }
};

// B1 레벨 어댑터: 중급 어휘 도입
export const B1Adapter: LevelAdapter = {
  adapt: (content, level) => {
    return {
      ...content,
      question: addIntermediateVocabulary(content.question),
      options: content.options?.map(opt => addIntermediateVocabulary(opt)),
      explanation: addNuance(content.explanation),
      example: content.example ? addIntermediateVocabulary(content.example) : undefined
    };
  }
};

// B2 레벨 어댑터: 논리적 요소 추가
export const B2Adapter: LevelAdapter = {
  adapt: (content, level) => {
    return {
      ...content,
      question: addLogicalComplexity(content.question),
      options: content.options?.map(opt => addLogicalComplexity(opt)),
      explanation: addAnalysis(content.explanation),
      example: content.example ? addLogicalComplexity(content.example) : undefined
    };
  }
};

// C1 레벨 어댑터: 추상적 개념
export const C1Adapter: LevelAdapter = {
  adapt: (content, level) => {
    return {
      ...content,
      question: addAbstraction(content.question),
      options: content.options?.map(opt => addAbstraction(opt)),
      explanation: addTheoreticalFramework(content.explanation),
      example: content.example ? addAbstraction(content.example) : undefined
    };
  }
};

// C2 레벨 어댑터: 최고급 정교함
export const C2Adapter: LevelAdapter = {
  adapt: (content, level) => {
    return {
      ...content,
      question: addSophistication(content.question),
      options: content.options?.map(opt => addSophistication(opt)),
      explanation: addSubtleDistinctions(content.explanation),
      example: content.example ? addSophistication(content.example) : undefined
    };
  }
};

export const adaptForLevel = (
  assignment: Assignment,
  level: string
): Assignment => {
  const adapterMap = {
    'A1': A1Adapter,
    'A2': A2Adapter,
    'B1': B1Adapter,
    'B2': B2Adapter,
    'C1': C1Adapter,
    'C2': C2Adapter
  };

  const adapter = adapterMap[level as keyof typeof adapterMap] || B1Adapter;

  return {
    ...assignment,
    content: adapter.adapt(assignment.content, level),
    metadata: {
      ...assignment.metadata,
      adaptedFor: level
    }
  };
};

// 헬퍼 함수
function simplifyVocabulary(text: string): string {
  const replacements = {
    'utilize': 'use',
    'commence': 'start',
    'endeavor': 'try',
    'sufficient': 'enough',
    'approximately': 'about'
  };

  return Object.entries(replacements).reduce(
    (text, [complex, simple]) => text.replace(new RegExp(complex, 'gi'), simple),
    text
  );
}

function simplifyExplanation(text: string): string {
  return text.replace(/(?:다음과 같이|규칙에 따라)/g, '')
             .replace(/매우|높은|깊은/g, '매우');
}

function addBasicContext(text: string): string {
  return text.replace(/(\w+)(?=[.,!?])/g, '$1 (단어)');
}

function addBasicExamples(text: string): string {
  return `${text}. 예: "I like apples."`;
}

function addIntermediateVocabulary(text: string): string {
  return text.replace(/good/g, 'excellent')
             .replace(/bad/g, 'inadequate')
             .replace(/big/g, 'considerable');
}

function addNuance(text: string): string {
  return text.replace(/(?<=\.)$/, ' 이 표현은 미묘한 차이가 있습니다.');
}

function addLogicalComplexity(text: string): string {
  return `만약 ${text}라면, 그 결과는?`;
}

function addAnalysis(text: string): string {
  return `${text}. 분석: 이 표현의 문맥적 의미를 고려해야 합니다.`;
}

function addAbstraction(text: string): string {
  return `개념적으로, ${text}`;
}

function addTheoreticalFramework(text: string): string {
  return `${text}. 이는 [이론적 프레임워크]에서 볼 수 있습니다.`;
}

function addSophistication(text: string): string {
  return text.replace(/important/g, 'imperative')
             .replace(/understand/g, 'comprehend')
             .replace(/consider/g, 'contemplate');
}

function addSubtleDistinctions(text: string): string {
  return `${text}. 이 표현의 미묘한 차이는 철학적 맥락에서 중요합니다.`;
}

// Assignment 타입 확장을 위한 상수
export const LEVEL_ADAPTERS = {
  A1: A1Adapter,
  A2: A2Adapter,
  B1: B1Adapter,
  B2: B2Adapter,
  C1: C1Adapter,
  C2: C2Adapter
} as const;