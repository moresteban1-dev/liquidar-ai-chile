'use server';

import { createAction } from '@/lib/safe-action';
import { PromptRegistry } from '@core/ai/prompts/PromptRegistry';
import { AIProviderFactory } from '@infrastructure/ai/AIProviderFactory';
import { 
  competitiveAnalysisInputSchema, 
  competitiveAnalysisOutputSchema,
  promptEvaluationInputSchema,
  promptEvaluationOutputSchema,
  seoContentInputSchema,
  seoContentOutputSchema,
  excelImportConfigSchema
} from '@/lib/validators/tools-validators';
import { z } from 'zod';

/**
 * 1. Server Action: Análisis Competitivo
 */
export const runCompetitiveAnalysisAction = createAction({
  name: 'run-competitive-analysis',
  schema: competitiveAnalysisInputSchema,
  rateLimitKey: 'tools_competitive_analysis',
  rateLimitMax: 5
}, async (input) => {
  const provider = AIProviderFactory.getProvider('gemini');
  const promptTemplate = PromptRegistry.get('COMPETITIVE_ANALYSIS', 'v1');
  const compiledPrompt = promptTemplate({
    businessName: input.businessName,
    industry: input.industry,
    location: input.location,
    targetMarket: input.targetMarket || '',
    analysisScope: input.analysisScope,
    competitors: input.competitors.map((c, i) => `
COMPETIDOR ${i + 1}: ${c.name}
Web: ${c.website || 'N/A'}
Reseñas: ${c.reviews || 'N/A'}
Precios: ${c.pricingInfo || 'N/A'}
Redes: ${c.socialContent || 'N/A'}
Notas: ${c.additionalNotes || 'N/A'}
`).join('\n')
  });

  const result = await provider.generateStructured({
    prompt: compiledPrompt,
    outputSchema: competitiveAnalysisOutputSchema,
    complexity: 'complex',
    temperature: 0.3
  });

  if (result.isFailure()) {
    throw new Error(result.error.message);
  }

  return result.value;
});

/**
 * 2. Server Action: Evaluador de Prompts
 */
export const runPromptEvaluationAction = createAction({
  name: 'run-prompt-evaluation',
  schema: promptEvaluationInputSchema,
  rateLimitKey: 'tools_prompt_evaluation',
  rateLimitMax: 10
}, async (input) => {
  const provider = AIProviderFactory.getProvider('gemini');
  const promptTemplate = PromptRegistry.get('PROMPT_EVALUATION', 'v1');
  const compiledPrompt = promptTemplate({
    originalPrompt: input.originalPrompt,
    businessContext: input.businessContext,
    category: input.category,
    targetAudience: input.targetAudience || '',
    desiredOutput: input.desiredOutput || ''
  });

  const result = await provider.generateStructured({
    prompt: compiledPrompt,
    outputSchema: promptEvaluationOutputSchema,
    complexity: 'moderate',
    temperature: 0.2
  });

  if (result.isFailure()) {
    throw new Error(result.error.message);
  }

  return result.value;
});

/**
 * 3. Server Action: Arquitecto SEO
 */
export const runSEOArchitectAction = createAction({
  name: 'run-seo-architect',
  schema: seoContentInputSchema,
  rateLimitKey: 'tools_seo_architect',
  rateLimitMax: 5
}, async (input) => {
  const provider = AIProviderFactory.getProvider('gemini');
  const promptTemplate = PromptRegistry.get('SEO_CONTENT_GENERATION', 'v1');
  const compiledPrompt = promptTemplate({
    contentType: input.contentType,
    topic: input.topic,
    industry: input.industry,
    country: input.country,
    city: input.city || '',
    searchIntent: input.searchIntent,
    targetClientType: input.targetClientType || '',
    existingContent: input.existingContent || '',
    targetKeywords: input.targetKeywords || []
  });

  const result = await provider.generateStructured({
    prompt: compiledPrompt,
    outputSchema: seoContentOutputSchema,
    complexity: 'complex', 
    temperature: 0.5
  });

  if (result.isFailure()) {
    throw new Error(result.error.message);
  }

  return result.value;
});

/**
 * 4. Server Action: Enriquecimiento de Excel
 */
export const runExcelDataEnrichmentAction = createAction({
  name: 'run-excel-enrichment',
  schema: z.object({
    templateType: z.string(),
    columns: z.array(z.string()),
    sampleData: z.string(),
    industry: z.string(),
    enrichmentGoals: z.array(z.string())
  }),
  rateLimitKey: 'tools_excel_enrichment',
  rateLimitMax: 3
}, async (input) => {
  const provider = AIProviderFactory.getProvider('gemini');
  const promptTemplate = PromptRegistry.get('EXCEL_DATA_ENRICHMENT', 'v1');
  const compiledPrompt = promptTemplate({
    templateType: input.templateType,
    columns: input.columns,
    sampleData: input.sampleData,
    industry: input.industry,
    enrichmentGoals: input.enrichmentGoals
  });

  const { excelDataEnrichmentOutputSchema } = await import('@/lib/validators/tools-validators');

  const result = await provider.generateStructured({
    prompt: compiledPrompt,
    outputSchema: excelDataEnrichmentOutputSchema,
    complexity: 'complex', 
    temperature: 0.1
  });

  if (result.isFail()) {
    throw new Error(result.error.message);
  }

  return result.value;
});
