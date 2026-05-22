import type { AIProviderType } from './tool-execution.types';

/** Tipo de contenido SEO */
export type SEOContentType = 'article' | 'service-description' | 'category-page' | 'commercial-post' | 'faq-page' | 'landing-page';

/** Intención de búsqueda */
export type SearchIntent = 'informational' | 'transactional' | 'navigational' | 'commercial-investigation';

/** Input para generación SEO */
export interface SEOContentInput {
  contentType: SEOContentType;
  topic: string;
  industry: string;
  country: string;
  city?: string;
  searchIntent: SearchIntent;
  targetClientType?: string;
  existingContent?: string;
  targetKeywords?: string[];
  competitorUrls?: string[];
  preferredProvider?: AIProviderType;
}

/** Nodo de estructura de headings */
export interface HeadingNode {
  level: 1 | 2 | 3;
  text: string;
  children?: HeadingNode[];
}

/** FAQ generado */
export interface FAQ {
  question: string;
  answer: string;
}

/** Sugerencia de interlinking */
export interface InterlinkSuggestion {
  anchorText: string;
  suggestedUrl: string;
  relevance: 'high' | 'medium' | 'low';
  reason: string;
}

/** Output completo de generación SEO */
export interface SEOContentOutput {
  seoTitle: string;
  slug: string;
  metaDescription: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  longTailKeywords: string[];
  headingStructure: HeadingNode[];
  generatedContent: string;
  faqs: FAQ[];
  schemaMarkup: Record<string, unknown>;
  interlinkingStrategy: InterlinkSuggestion[];
  localSEORecommendations: string[];
  contentScore: number;
  wordCount: number;
}
