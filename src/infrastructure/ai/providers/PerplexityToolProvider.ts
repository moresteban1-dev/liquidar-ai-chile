import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import type { IAIToolProvider } from '@core/application/ports/IAIToolProvider';
import type { AIProviderType } from '@core/domain/tools/tool-execution.types';
import { z } from 'zod';
import { generateText as vercelGenerateText, generateObject as vercelGenerateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Proveedor de IA basado en Perplexity AI (búsquedas en tiempo real)
 * Implementa IAIToolProvider usando la API compatible con OpenAI
 */
export class PerplexityToolProvider implements IAIToolProvider {
  readonly providerType: AIProviderType = 'perplexity';
  private readonly perplexity: ReturnType<typeof createOpenAI>;

  constructor(private readonly apiKey: string, private readonly defaultModel: string = 'sonar-medium-online') {
    this.perplexity = createOpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://api.perplexity.ai',
    });
  }

  private getModelId(complexity?: 'simple' | 'moderate' | 'complex'): string {
    // Perplexity tiene modelos de búsqueda específicos
    return this.defaultModel;
  }

  /**
   * Genera datos estructurados tipados usando un esquema de Zod
   */
  async generateStructured<T>(params: {
    prompt: string;
    systemPrompt?: string;
    outputSchema: z.ZodType<T>;
    temperature?: number;
    maxTokens?: number;
    complexity?: 'simple' | 'moderate' | 'complex';
  }): Promise<Result<T, AppError>> {
    try {
      const model = this.perplexity(this.getModelId(params.complexity));
      
      const { object } = await vercelGenerateObject({
        model,
        schema: params.outputSchema,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.2,
      });

      return ok(object);
    } catch (error: any) {
      console.error('Perplexity Provider Structured Error:', error);
      return fail(AppError.infrastructure(error.message || 'Error generating structured output with Perplexity'));
    }
  }

  /**
   * Genera contenido largo de texto plano con búsquedas online
   */
  async generateText(params: {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    complexity?: 'simple' | 'moderate' | 'complex';
  }): Promise<Result<string, AppError>> {
    try {
      const model = this.perplexity(this.getModelId(params.complexity));
      
      const { text } = await vercelGenerateText({
        model,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.5,
      });

      return ok(text);
    } catch (error: any) {
      console.error('Perplexity Provider Text Error:', error);
      return fail(AppError.infrastructure(error.message || 'Error generating text output with Perplexity'));
    }
  }

  /**
   * Verifica si la clave de API está configurada
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
