export enum AssignmentType {
  SEMANTIC_UNIT = "semantic_unit",
  DISCOURSE_MARKER = "discourse_marker",
  COLLOCATION = "collocation",
  THESAURUS = "thesaurus",
  CONTEXT_GUESS = "context_guess",
  WORD_FORMATION = "word_formation",
  REGISTER_MATCH = "register_match",
  PRAGMATICS = "pragmatics",
  GRAMMAR_INTEGRATION = "grammar_integration",
  GAP_BRIDGE = "gap_bridge"
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