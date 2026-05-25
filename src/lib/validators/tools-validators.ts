import { z } from 'zod';
// (Importamos los validators existentes para mantener el archivo completo)
// ─── Análisis Competitivo ───────────────────────────────────

export const analysisScopeSchema = z.enum([
    'reviews', 'social', 'website', 'pricing',
    'seo', 'messaging', 'value-proposition',
]);

const competitorDataSchema = z.object({
    name: z.string().min(1, 'El nombre del competidor es obligatorio'),
    website: z.string().url().optional().or(z.literal('')),
    reviews: z.string().optional(),
    socialContent: z.string().optional(),
    pricingInfo: z.string().optional(),
    additionalNotes: z.string().optional(),
});

export const competitiveAnalysisInputSchema = z.object({
    businessName: z.string().min(2, 'Nombre del negocio requerido'),
    industry: z.string().min(2, 'Industria/rubro requerido'),
    location: z.string().min(2, 'Ubicación requerida'),
    targetMarket: z.string().optional(),
    competitors: z
        .array(competitorDataSchema)
        .min(1, 'Agrega al menos un competidor')
        .max(10, 'Máximo 10 competidores por análisis'),
    analysisScope: z
        .array(analysisScopeSchema)
        .min(1, 'Selecciona al menos un alcance de análisis'),
});

export type CompetitiveAnalysisFormInput = z.infer<typeof competitiveAnalysisInputSchema>;

// OUTPUT SCHEMA: Análisis Competitivo
export const competitiveAnalysisOutputSchema = z.object({
    topCompetitors: z.array(z.object({
        name: z.string(),
        website: z.string().optional(),
        differentiators: z.array(z.string()),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        pricingTier: z.enum(['budget', 'mid-range', 'premium', 'unknown']),
        marketPosition: z.string()
    })),
    positivePatterns: z.array(z.object({
        pattern: z.string(),
        frequency: z.enum(['rare', 'occasional', 'frequent', 'dominant']),
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        evidence: z.array(z.string()),
        businessImplication: z.string()
    })),
    negativePatterns: z.array(z.object({
        pattern: z.string(),
        frequency: z.enum(['rare', 'occasional', 'frequent', 'dominant']),
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        evidence: z.array(z.string()),
        businessImplication: z.string()
    })),
    frequentComplaints: z.array(z.string()),
    improvementOpportunities: z.array(z.string()),
    marketGaps: z.array(z.object({
        gap: z.string(),
        opportunity: z.string(),
        difficulty: z.enum(['low', 'medium', 'high']),
        potentialImpact: z.enum(['low', 'medium', 'high']),
        suggestedAction: z.string()
    })),
    actionableInsights: z.array(z.object({
        insight: z.string(),
        category: z.enum(['product', 'marketing', 'pricing', 'service', 'operations']),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        effort: z.enum(['low', 'medium', 'high']),
        suggestedAction: z.string(),
        expectedOutcome: z.string()
    })),
    commercialRecommendations: z.array(z.string()),
    contentIdeas: z.array(z.object({
        title: z.string(),
        type: z.enum(['blog', 'social', 'video', 'infographic', 'case-study']),
        targetKeyword: z.string().optional(),
        brief: z.string()
    })),
    competitiveOffers: z.array(z.string()),
    executiveSummary: z.string()
});


// ─── Evaluación de Prompts ──────────────────────────────────

export const promptCategorySchema = z.enum([
    'research', 'marketing', 'sales', 'operations',
    'product', 'strategy', 'customer-service', 'hr',
]);

export const promptEvaluationInputSchema = z.object({
    originalPrompt: z
        .string()
        .min(20, 'El prompt debe tener al menos 20 caracteres')
        .max(10_000, 'El prompt no puede superar 10.000 caracteres'),
    businessContext: z.string().min(10, 'Describe el contexto de tu negocio'),
    category: promptCategorySchema,
    targetAudience: z.string().optional(),
    desiredOutput: z.string().optional(),
});

export type PromptEvaluationFormInput = z.infer<typeof promptEvaluationInputSchema>;

// OUTPUT SCHEMA: Evaluación de Prompt
const qualityDimensionSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    suggestion: z.string()
});

export const promptEvaluationOutputSchema = z.object({
    qualityScore: z.number().min(0).max(100),
    evaluation: z.object({
        clarity: qualityDimensionSchema,
        specificity: qualityDimensionSchema,
        context: qualityDimensionSchema,
        actionability: qualityDimensionSchema,
        measurability: qualityDimensionSchema,
        completeness: qualityDimensionSchema
    }),
    missingQuestions: z.array(z.string()),
    unconsideredVariables: z.array(z.string()),
    misinterpretationRisks: z.array(z.string()),
    reformulatedPrompt: z.string(),
    improvedPrompt: z.string(),
    expertPrompt: z.string(),
    perplexityVersion: z.string(),
    claudeVersion: z.string(),
    openaiVersion: z.string(),
    qualityChecklist: z.array(z.object({
        criterion: z.string(),
        passed: z.boolean(),
        recommendation: z.string().optional()
    })),
    executiveSummary: z.string()
});


// ─── Generación SEO ─────────────────────────────────────────

export const seoContentTypeSchema = z.enum([
    'article', 'service-description', 'category-page',
    'commercial-post', 'faq-page', 'landing-page',
]);

export const searchIntentSchema = z.enum([
    'informational', 'transactional',
    'navigational', 'commercial-investigation',
]);

export const seoContentInputSchema = z.object({
    contentType: seoContentTypeSchema,
    topic: z.string().min(5, 'Describe el tema del contenido'),
    industry: z.string().min(2, 'Industria/rubro requerido'),
    country: z.string().min(2, 'País requerido'),
    city: z.string().optional(),
    searchIntent: searchIntentSchema,
    targetClientType: z.string().optional(),
    existingContent: z.string().optional(),
    targetKeywords: z.array(z.string()).optional(),
    competitorUrls: z.array(z.string().url()).optional(),
});

export type SEOContentFormInput = z.infer<typeof seoContentInputSchema>;

// OUTPUT SCHEMA: Arquitecto SEO
const headingNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    text: z.string(),
    children: z.array(headingNodeSchema).optional()
}));

export const seoContentOutputSchema = z.object({
    seoTitle: z.string(),
    slug: z.string(),
    metaDescription: z.string(),
    primaryKeywords: z.array(z.string()),
    secondaryKeywords: z.array(z.string()),
    longTailKeywords: z.array(z.string()),
    headingStructure: z.array(headingNodeSchema),
    generatedContent: z.string(),
    faqs: z.array(z.object({
        question: z.string(),
        answer: z.string()
    })),
    schemaMarkup: z.record(z.string(), z.unknown()),
    interlinkingStrategy: z.array(z.object({
        anchorText: z.string(),
        suggestedUrl: z.string(),
        relevance: z.enum(['high', 'medium', 'low']),
        reason: z.string()
    })),
    localSEORecommendations: z.array(z.string()),
    contentScore: z.number().min(0).max(100),
    wordCount: z.number()
});


// ─── Importación de Excel ───────────────────────────────────

export const templateTypeSchema = z.enum([
    'prospects', 'suppliers', 'companies', 'contacts', 'custom',
]);

export const deduplicationStrategySchema = z.enum([
    'email', 'phone', 'name-and-company', 'none',
]);

export const columnMappingSchema = z.object({
    excelColumn: z.string().min(1),
    systemField: z.string().min(1),
    isRequired: z.boolean(),
    transform: z.enum(['uppercase', 'lowercase', 'trim', 'phone-format', 'email-normalize']).optional(),
});

export const excelImportConfigSchema = z.object({
    templateType: templateTypeSchema,
    columnMapping: z.array(columnMappingSchema).min(1, 'Mapea al menos una columna'),
    deduplicationStrategy: deduplicationStrategySchema,
    enrichWithAI: z.boolean().default(false),
    skipHeaderRows: z.number().int().min(0).max(10).default(1),
    maxRows: z.number().int().min(1).max(50_000).optional(),
});

export type ExcelImportConfigInput = z.infer<typeof excelImportConfigSchema>;

// OUTPUT SCHEMA: Excel Data Enrichment
export const excelDataEnrichmentOutputSchema = z.array(z.object({
    originalRowId: z.number(),
    classification: z.object({
        industry: z.string(),
        estimatedSize: z.string(),
        priority: z.enum(['high', 'medium', 'low', 'undetermined'])
    }),
    segment: z.string(),
    dataQuality: z.object({
        status: z.enum(['complete', 'partial', 'insufficient']),
        missingCriticalFields: z.array(z.string())
    }),
    suggestedCorrections: z.record(z.string(), z.string()),
    potentialDuplicate: z.boolean()
}));
