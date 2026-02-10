export enum AssignmentType {
  SEMANTIC_UNIT = "semantic_unit",      // 의미단위 분석
  DISCOURSE_MARKER = "discourse_marker", // 담화표지
  COLLOCATION = "collocation",           // collocation
  THESAURUS = "thesaurus",               // 유의어/반의어
  CONTEXT_GUESS = "context_guess",       // 문맥 추론
  WORD_FORMATION = "word_formation",     // 어형 변화
  REGISTER_MATCH = "register_match",       // 체급 일치
  PRAGMATICS = "pragmatics",             // 화용론
  GRAMMAR_INTEGRATION = "grammar_integration", // 문법 통합
  GAP_BRIDGE = "gap_bridge"              // 갭 브릿지
}

export interface Assignment {
  id?: string;
  type: AssignmentType;
  content: AssignmentContent;
  difficulty: 'easy' | 'medium' | 'hard';
  level: string;
  metadata?: any;
}

export interface AssignmentContent {
  question: string;
  options?: string[];
  answer: string | string[];
  explanation: string;
  hint?: string;
  example?: string;
}

export interface GapData {
  vocabulary: string[];
  grammar: string[];
  totalWords: number;
  mastered: number;
  weakAreas: string[];
  strengths: string[];
}

export interface LevelAdapter {
  adapt: (assignment: AssignmentContent, level: string) => AssignmentContent;
}