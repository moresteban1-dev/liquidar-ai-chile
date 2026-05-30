import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import type { IAIToolProvider } from '@core/application/ports/IAIToolProvider';
import type { AIProviderType } from '@core/domain/tools/tool-execution.types';
import { z } from 'zod';
import { generateText as vercelGenerateText, generateObject as vercelGenerateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

/**
 * Proveedor de IA basado en Anthropic Claude
 * Implementa IAIToolProvider para ejecutar tareas cognitivas complejas
 */
export class AnthropicToolProvider implements IAIToolProvider {
  readonly providerType: AIProviderType = 'claude';
  private readonly anthropic: ReturnType<typeof createAnthropic>;

  constructor(private readonly apiKey: string, private readonly defaultModel: string = 'claude-3-5-sonnet-20241022') {
    this.anthropic = createAnthropic({
      apiKey: this.apiKey,
    });
  }

  private getModelId(complexity?: 'simple' | 'moderate' | 'complex'): string {
    if (complexity === 'simple') {
      return 'claude-3-haiku-20240307';
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
      const model = this.anthropic(this.getModelId(params.complexity));
      
      const { object } = await vercelGenerateObject({
        model,
        schema: params.outputSchema,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.3,
      });

      return ok(object);
    } catch (error: any) {
      console.error('Anthropic Provider Structured Error:', error);
      return fail(AppError.infrastructure(error.message || 'Error generating structured output with Anthropic'));
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
      const model = this.anthropic(this.getModelId(params.complexity));
      
      const { text } = await vercelGenerateText({
        model,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.7,
      });

      return ok(text);
    } catch (error: any) {
      console.error('Anthropic Provider Text Error:', error);
      return fail(AppError.infrastructure(error.message || 'Error generating text output with Anthropic'));
    }
  }

  /**
   * Verifica si la clave de API está configurada
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
