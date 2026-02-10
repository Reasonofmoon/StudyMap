import Anthropic from '@anthropic-ai/sdk';
import { AssignmentType, Assignment, AssignmentContent, GapData, LevelAdapter } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function generateAssignment(params: {
  studentLevel: string;
  gapData: GapData;
  type: AssignmentType;
}): Promise<Assignment> {
  const { studentLevel, gapData, type } = params;

  const prompt = buildPrompt(type, studentLevel, gapData);
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: prompt
    }]
  });

  const content = response.content[0].text;
  return parseAssignment(type, content, studentLevel);
}

function buildPrompt(type: AssignmentType, level: string, gapData: GapData): string {
  const typeDescriptions = {
    [AssignmentType.SEMANTIC_UNIT]: `의미단위 분석: 단어의 핵심 의미를 파악하고 문맥에서의 용법을 분석하는 문제를 생성하세요.`,
    [AssignmentType.DISCOURSE_MARKER]: `담화표지: 대화의 흐름을 이해하고 적절한 표현을 선택하는 문제를 생성하세요.`,
    [AssignmentType.COLLOCATION]: `Collocation: 자연스러운 표현을 만드는 단어 조합을 선택하는 문제를 생성하세요.`,
    [AssignmentType.THESAURUS]: `유의어/반의어: 단어의 뉘앙스 차이를 이해하는 문제를 생성하세요.`,
    [AssignmentType.CONTEXT_GUESS]: `문맥 추론: 주변 문맥을 통해 단어의 의미를 추론하는 문제를 생성하세요.`,
    [AssignmentType.WORD_FORMATION]: `어형 변화: 단어의 형태를 변형시켜 새로운 의미를 만드는 문제를 생성하세요.`,
    [AssignmentType.REGISTER_MATCH]: `체급 일치: 상황에 맞는 적절한 표현 레벨을 선택하는 문제를 생성하세요.`,
    [AssignmentType.PRAGMATICS]: `화용론: 의미 이상의 의미(사용자 의도, 뉘앙스)를 파악하는 문제를 생성하세요.`,
    [AssignmentType.GRAMMAR_INTEGRATION]: `문법 통합: 문법 규칙과 어휘 지식을 결합하는 복합 문제를 생성하세요.`,
    [AssignmentType.GAP_BRIDGE]: `갭 브릿지: 학생의 약점을 보완하는 개인화된 연습 문제를 생성하세요.`
  };

  const levelTargets = {
    A1: `초급: 간단한 어휘와 기본 문장 구조에 집중하세요. 200어 내외의 초등 어휘 수준입니다.`,
    A2: `초-중급: 일상 대화에 필요한 어휘를 사용하세요. B1 단계로의 과도를 지원합니다.`,
    B1: `중급: 자연스러운 대화 어휘를 사용하세요. 추상적인 개념을 간단히 설명할 수 있어야 합니다.`,
    B2: `중-고급: 전문 용어와 복합 문장을 사용하세요. 논리적인 추론이 필요합니다.`,
    C1: `고급: 미세한 뉘앙스 차이를 파악할 수 있는 고급 어휘를 사용하세요. 추상적 개념을 깊이 있게 다룹니다.`,
    C2: `최고급: 매우 정교한 표현을 사용하세요. 문화적 배경과 맥락 깊이를 반영해야 합니다.`
  };

  return `
# EduOntology 개인화 연습문제 생성

학생 정보:
- 수준: ${level}
- 약점 어휘: ${gapData.vocabulary.slice(0, 5).join(', ')}
- 약점 문법: ${gapData.grammar.join(', ')}
- 마스터 어휘 수: ${gapData.mastered}/${gapData.totalWords}

문제 유형: ${typeDescriptions[type]}
대상 수준: ${levelTargets[level as keyof typeof levelTargets]}

요구사항:
1. 4지 선다형 또는 OX형 문제로 생성하세요
2. 정답과 상세한 해설 포함
3. 학생의 약점을 보완할 수 있는 콘텐츠
4. JSON 형식으로 반환하세요

예시 형식:
{
  "question": "질문 내용",
  "options": ["옵션1", "옵션2", "옵션3", "옵션4"],
  "answer": "정답",
  "explanation": "해설",
  "hint": "힌트 (선택사항)",
  "example": "예시 문장 (선택사항)"
}
`;
}

function parseAssignment(type: AssignmentType, content: string, level: string): Assignment {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    const requiredFields = ['question', 'answer', 'explanation'];
    for (const field of requiredFields) {
      if (!parsed[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Determine difficulty based on level
    const difficultyMap = {
      'A1': 'easy' as const,
      'A2': 'easy' as const,
      'B1': 'medium' as const,
      'B2': 'medium' as const,
      'C1': 'hard' as const,
      'C2': 'hard' as const
    };

    return {
      type,
      content: {
        question: parsed.question,
        options: parsed.options || undefined,
        answer: parsed.answer,
        explanation: parsed.explanation,
        hint: parsed.hint || undefined,
        example: parsed.example || undefined
      },
      difficulty: difficultyMap[level as keyof typeof difficultyMap] || 'medium',
      level,
      metadata: {
        optionsProvided: !!parsed.options,
        hintProvided: !!parsed.hint,
        exampleProvided: !!parsed.example
      }
    };
  } catch (error) {
    throw new Error(`Failed to parse assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function batchGenerateAssignments(params: {
  studentLevel: string;
  gapData: GapData;
  types: AssignmentType[];
}): Promise<Assignment[]> {
  const promises = params.types.map(type =>
    generateAssignment({
      studentLevel: params.studentLevel,
      gapData: params.gapData,
      type
    })
  );

  return Promise.all(promises);
}