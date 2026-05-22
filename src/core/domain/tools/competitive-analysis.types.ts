/**
 * @module competitive-analysis.types
 * @description Tipos de dominio para la herramienta de Análisis Competitivo.
 * Modela el flujo completo: desde la entrada de datos de competidores
 * hasta los insights accionables y recomendaciones de mercado.
 */

import type { AIProviderType } from './tool-execution.types';

// ─── Tipos de Unión ─────────────────────────────────────────────────────────

/** Alcance del análisis competitivo — qué dimensiones analizar */
export type AnalysisScope =
  | 'reviews'
  | 'social'
  | 'website'
  | 'pricing'
  | 'seo'
  | 'messaging'
  | 'value-proposition';

/** Rango de precios del competidor */
export type PricingTier = 'budget' | 'mid-range' | 'premium' | 'unknown';

/** Frecuencia con la que se observa un patrón */
export type PatternFrequency = 'rare' | 'occasional' | 'frequent' | 'dominant';

/** Sentimiento detectado en un patrón */
export type Sentiment = 'positive' | 'negative' | 'neutral';

/** Nivel de dificultad o impacto */
export type ImpactLevel = 'low' | 'medium' | 'high';

/** Prioridad de acción */
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';

/** Categoría de un insight accionable */
export type InsightCategory = 'product' | 'marketing' | 'pricing' | 'service' | 'operations';

/** Tipo de contenido sugerido */
export type ContentType = 'blog' | 'social' | 'video' | 'infographic' | 'case-study';

// ─── Interfaces de Entrada ──────────────────────────────────────────────────

/**
 * Datos de un competidor proporcionados por el administrador.
 * Toda la información es textual y será procesada por la IA.
 */
export interface CompetitorData {
  /** Nombre del competidor */
  readonly name: string;
  /** URL del sitio web del competidor */
  readonly website?: string;
  /** Texto de reseñas copiadas de distintas fuentes */
  readonly reviews?: string;
  /** Contenido capturado de redes sociales */
  readonly socialContent?: string;
  /** Información de precios visible públicamente */
  readonly pricingInfo?: string;
  /** Notas adicionales del administrador */
  readonly additionalNotes?: string;
}

/**
 * Input completo para solicitar un análisis competitivo.
 * Contiene el contexto del negocio y los datos de los competidores a analizar.
 */
export interface CompetitiveAnalysisInput {
  /** Nombre del negocio que solicita el análisis */
  readonly businessName: string;
  /** Industria o sector del negocio */
  readonly industry: string;
  /** Ubicación geográfica del negocio */
  readonly location: string;
  /** Mercado objetivo (segmento demográfico) */
  readonly targetMarket?: string;
  /** Lista de competidores con sus datos */
  readonly competitors: CompetitorData[];
  /** Dimensiones del análisis a realizar */
  readonly analysisScope: AnalysisScope[];
  /** Proveedor de IA preferido para el análisis */
  readonly preferredProvider?: AIProviderType;
}

// ─── Interfaces de Salida ───────────────────────────────────────────────────

/**
 * Perfil analizado de un competidor.
 * Resume las fortalezas, debilidades y posición de mercado.
 */
export interface CompetitorProfile {
  /** Nombre del competidor */
  readonly name: string;
  /** URL del sitio web */
  readonly website?: string;
  /** Factores diferenciadores identificados */
  readonly differentiators: string[];
  /** Fortalezas clave del competidor */
  readonly strengths: string[];
  /** Debilidades detectadas */
  readonly weaknesses: string[];
  /** Rango de precios en el mercado */
  readonly pricingTier: PricingTier;
  /** Descripción de la posición de mercado */
  readonly marketPosition: string;
}

/**
 * Patrón identificado en reseñas, contenido social u otras fuentes.
 * Incluye evidencia textual y su implicación para el negocio.
 */
export interface InsightPattern {
  /** Descripción del patrón identificado */
  readonly pattern: string;
  /** Frecuencia con la que se observa */
  readonly frequency: PatternFrequency;
  /** Sentimiento general asociado */
  readonly sentiment: Sentiment;
  /** Fragmentos de texto que evidencian el patrón */
  readonly evidence: string[];
  /** Implicación directa para el negocio del usuario */
  readonly businessImplication: string;
}

/**
 * Gap de mercado detectado — oportunidad no cubierta por competidores.
 */
export interface MarketGap {
  /** Descripción del gap identificado */
  readonly gap: string;
  /** Oportunidad concreta derivada del gap */
  readonly opportunity: string;
  /** Dificultad estimada para aprovechar la oportunidad */
  readonly difficulty: ImpactLevel;
  /** Impacto potencial en el negocio */
  readonly potentialImpact: ImpactLevel;
  /** Acción sugerida para capitalizar el gap */
  readonly suggestedAction: string;
}

/**
 * Insight accionable con prioridad, esfuerzo y resultado esperado.
 * Diseñado para ser directamente ejecutable por el equipo del negocio.
 */
export interface ActionableInsight {
  /** Descripción del insight */
  readonly insight: string;
  /** Categoría del negocio afectada */
  readonly category: InsightCategory;
  /** Nivel de prioridad recomendado */
  readonly priority: ActionPriority;
  /** Esfuerzo estimado de implementación */
  readonly effort: ImpactLevel;
  /** Acción concreta sugerida */
  readonly suggestedAction: string;
  /** Resultado esperado al implementar la acción */
  readonly expectedOutcome: string;
}

/**
 * Idea de contenido derivada del análisis competitivo.
 * Genera oportunidades de marketing de contenidos.
 */
export interface ContentIdea {
  /** Título propuesto para el contenido */
  readonly title: string;
  /** Tipo/formato del contenido */
  readonly type: ContentType;
  /** Keyword objetivo para SEO */
  readonly targetKeyword?: string;
  /** Brief con instrucciones para crear el contenido */
  readonly brief: string;
}

/**
 * Output completo del análisis competitivo.
 * Consolida todos los hallazgos, patrones, gaps y recomendaciones.
 */
export interface CompetitiveAnalysisOutput {
  /** Perfiles analizados de los competidores principales */
  readonly topCompetitors: CompetitorProfile[];
  /** Patrones positivos identificados en el mercado */
  readonly positivePatterns: InsightPattern[];
  /** Patrones negativos identificados en el mercado */
  readonly negativePatterns: InsightPattern[];
  /** Quejas frecuentes de clientes en la industria */
  readonly frequentComplaints: string[];
  /** Oportunidades de mejora detectadas */
  readonly improvementOpportunities: string[];
  /** Gaps de mercado no cubiertos */
  readonly marketGaps: MarketGap[];
  /** Insights accionables priorizados */
  readonly actionableInsights: ActionableInsight[];
  /** Recomendaciones comerciales estratégicas */
  readonly commercialRecommendations: string[];
  /** Ideas de contenido para marketing */
  readonly contentIdeas: ContentIdea[];
  /** Ofertas competitivas sugeridas */
  readonly competitiveOffers: string[];
  /** Resumen ejecutivo del análisis completo */
  readonly executiveSummary: string;
}
