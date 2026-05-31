import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import type { IAIToolProvider } from '@core/application/ports/IAIToolProvider';
import type { AIProviderType } from '@core/domain/tools/tool-execution.types';
import { z } from 'zod';
import { generateText as vercelGenerateText, generateObject as vercelGenerateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Proveedor de IA basado en Blackbox.ai
 * Implementa IAIToolProvider usando su API compatible con OpenAI.
 */
export class BlackboxToolProvider implements IAIToolProvider {
  readonly providerType: AIProviderType = 'blackbox';
  private readonly blackbox: ReturnType<typeof createOpenAI>;

  constructor(private readonly apiKey: string, private readonly defaultModel: string = 'blackbox') {
    this.blackbox = createOpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://api.blackbox.ai/v1',
    });
  }

  private getModelId(complexity?: 'simple' | 'moderate' | 'complex'): string {
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
      const model = this.blackbox(this.getModelId(params.complexity));
      
      const { object } = await vercelGenerateObject({
        model,
        schema: params.outputSchema,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.3,
      });

      return ok(object);
    } catch (error: any) {
      console.error('Blackbox Provider Structured Error:', error);
      return fail(AppError.infrastructure(error.message || 'Error generating structured output with Blackbox.ai'));
    }
  }

  /**
   * Genera contenido largo de texto plano
   */
  async generateText(params: {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    complexity?: 'simple' | 'moderate' | 'complex';
  }): Promise<Result<string, AppError>> {
    try {
      const model = this.blackbox(this.getModelId(params.complexity));
      
      const { text } = await vercelGenerateText({
        model,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.7,
      });

      return ok(text);
    } catch (error: any) {
      console.error('Blackbox Provider Text Error:', error);
      return fail(AppError.infrastructure(error.message || 'Error generating text output with Blackbox.ai'));
    }
  }

  /**
   * Verifica si la clave de API está configurada
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
