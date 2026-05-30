import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import type { IAIToolProvider } from '@core/application/ports/IAIToolProvider';
import type { AIProviderType } from '@core/domain/tools/tool-execution.types';
import { z } from 'zod';
import { generateText as vercelGenerateText, generateObject as vercelGenerateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Proveedor de IA basado en Groq Cloud (latencia ultrabaja)
 * Implementa IAIToolProvider usando la API compatible con OpenAI
 */
export class GroqToolProvider implements IAIToolProvider {
  readonly providerType: AIProviderType = 'groq';
  private readonly groq: ReturnType<typeof createOpenAI>;

  constructor(private readonly apiKey: string, private readonly defaultModel: string = 'llama3-70b-8192') {
    this.groq = createOpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  private getModelId(complexity?: 'simple' | 'moderate' | 'complex'): string {
    if (complexity === 'simple') {
      return 'llama3-8b-8192';
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
      const model = this.groq(this.getModelId(params.complexity));
      
      const { object } = await vercelGenerateObject({
        model,
        schema: params.outputSchema,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.2,
      });

      return ok(object);
    } catch (error: any) {
      console.error('Groq Provider Structured Error:', error);
      return fail(AppError.infrastructure(error.message || 'Error generating structured output with Groq'));
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
      const model = this.groq(this.getModelId(params.complexity));
      
      const { text } = await vercelGenerateText({
        model,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.5,
      });

      return ok(text);
    } catch (error: any) {
      console.error('Groq Provider Text Error:', error);
      return fail(AppError.infrastructure(error.message || 'Error generating text output with Groq'));
    }
  }

  /**
   * Verifica si la clave de API está configurada
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
