import type { AIProviderType } from './tool-execution.types';

/** Categoría del prompt a evaluar */
export type PromptCategory = 'research' | 'marketing' | 'sales' | 'operations' | 'product' | 'strategy' | 'customer-service' | 'hr';

/** Input para evaluación de prompt */
export interface PromptEvaluationInput {
  originalPrompt: string;
  businessContext: string;
  category: PromptCategory;
  targetAudience?: string;
  desiredOutput?: string;
  preferredProvider?: AIProviderType;
}

/** Evaluación detallada del prompt */
export interface PromptEvaluation {
  clarity: QualityDimension;
  specificity: QualityDimension;
  context: QualityDimension;
  actionability: QualityDimension;
  measurability: QualityDimension;
  completeness: QualityDimension;
}

/** Dimensión de calidad individual */
export interface QualityDimension {
  score: number;     // 0-100
  feedback: string;
  suggestion: string;
}

/** Ítem del checklist de calidad */
export interface ChecklistItem {
  criterion: string;
  passed: boolean;
  recommendation?: string;
}

/** Output completo de la evaluación de prompt */
export interface PromptEvaluationOutput {
  qualityScore: number;
  evaluation: PromptEvaluation;
  missingQuestions: string[];
  unconsideredVariables: string[];
  misinterpretationRisks: string[];
  reformulatedPrompt: string;
  improvedPrompt: string;
  expertPrompt: string;
  perplexityVersion: string;
  claudeVersion: string;
  openaiVersion: string;
  qualityChecklist: ChecklistItem[];
  executiveSummary: string;
}
