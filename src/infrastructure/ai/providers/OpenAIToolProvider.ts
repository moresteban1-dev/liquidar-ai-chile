import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import type { IAIToolProvider } from '@core/application/ports/IAIToolProvider';
import type { AIProviderType } from '@core/domain/tools/tool-execution.types';
import { z } from 'zod';
import { generateText as vercelGenerateText, generateObject as vercelGenerateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Proveedor de IA basado en OpenAI
 * Implementa IAIToolProvider para ejecutar tareas cognitivas de manera dinámica
 */
export class OpenAIToolProvider implements IAIToolProvider {
  readonly providerType: AIProviderType = 'openai';
  private readonly openai: ReturnType<typeof createOpenAI>;

  constructor(private readonly apiKey: string, private readonly defaultModel: string = 'gpt-4o-mini') {
    this.openai = createOpenAI({
      apiKey: this.apiKey,
    });
  }

  private getModelId(complexity?: 'simple' | 'moderate' | 'complex'): string {
    if (complexity === 'complex') {
      return 'gpt-4o';
    }
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
      const model = this.openai(this.getModelId(params.complexity));
      
      const { object } = await vercelGenerateObject({
        model,
        schema: params.outputSchema,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.3,
      });

      return ok(object);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAI Provider Structured Error:', error);
      return fail(AppError.infrastructure(message || 'Error generating structured output with OpenAI'));
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
      const model = this.openai(this.getModelId(params.complexity));
      
      const { text } = await vercelGenerateText({
        model,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.7,
      });

      return ok(text);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAI Provider Text Error:', error);
      return fail(AppError.infrastructure(message || 'Error generating text output with OpenAI'));
    }
  }

  /**
   * Verifica si la clave de API está configurada
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
