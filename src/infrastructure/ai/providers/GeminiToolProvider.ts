import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import type { IAIToolProvider } from '@core/application/ports/IAIToolProvider';
import type { AIProviderType } from '@core/domain/tools/tool-execution.types';
import { z } from 'zod';
import { generateText as vercelGenerateText, generateObject as vercelGenerateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

/**
 * Proveedor de IA basado en Google Gemini (AI SDK)
 * Implementa ResilientGenkitService de fondo o usa direct AI SDK
 */
export class GeminiToolProvider implements IAIToolProvider {
  readonly providerType: AIProviderType = 'gemini';
  private readonly google: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(private readonly apiKey: string) {
    this.google = createGoogleGenerativeAI({
      apiKey: this.apiKey,
    });
  }

  private getModelId(complexity?: 'simple' | 'moderate' | 'complex'): string {
    switch (complexity) {
      case 'simple': return 'gemini-2.5-flash';
      case 'complex': return 'gemini-2.5-pro';
      default: return 'gemini-2.5-flash';
    }
  }

  async generateStructured<T>(params: {
    prompt: string;
    systemPrompt?: string;
    outputSchema: z.ZodType<T>;
    temperature?: number;
    maxTokens?: number;
    complexity?: 'simple' | 'moderate' | 'complex';
  }): Promise<Result<T, AppError>> {
    try {
      const model = this.google(this.getModelId(params.complexity));
      
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
      console.error('Gemini Provider Error:', error);
      return fail(AppError.infrastructure(message || 'Error generating structured output with Gemini'));
    }
  }

  async generateText(params: {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    complexity?: 'simple' | 'moderate' | 'complex';
  }): Promise<Result<string, AppError>> {
    try {
      const model = this.google(this.getModelId(params.complexity));
      
      const { text } = await vercelGenerateText({
        model,
        prompt: params.prompt,
        system: params.systemPrompt,
        temperature: params.temperature ?? 0.7,
      });

      return ok(text);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Gemini Provider Error:', error);
      return fail(AppError.infrastructure(message || 'Error generating text output with Gemini'));
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
