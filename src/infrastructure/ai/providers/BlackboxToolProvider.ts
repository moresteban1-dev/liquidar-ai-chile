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

  /** 
   * Modelos válidos conocidos de la API de Blackbox.ai.
   * El ID de modelo debe incluir el prefijo del proveedor (ej: 'blackboxai/').
   */
  private static readonly VALID_MODEL_PREFIX = 'blackboxai/';
  private static readonly SAFE_FALLBACK_MODEL = 'blackboxai/blackbox-pro';

  constructor(private readonly apiKey: string, private readonly defaultModel: string = 'blackboxai/blackbox-pro') {
    this.blackbox = createOpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://api.blackbox.ai/v1',
    });
  }

  /**
   * Sanitiza el ID del modelo.
   * Rechaza valores genéricos o sin prefijo de proveedor que generan
   * el error: "Invalid model name passed in model=blackbox".
   */
  private sanitizeModelId(rawModel?: string): string {
    const model = rawModel ?? this.defaultModel;
    if (!model || !model.includes('/')) {
      console.warn(
        `[BlackboxToolProvider] Nombre de modelo inválido recibido: "${model}". ` +
        `Usando fallback seguro: "${BlackboxToolProvider.SAFE_FALLBACK_MODEL}".`
      );
      return BlackboxToolProvider.SAFE_FALLBACK_MODEL;
    }
    return model;
  }

  private getModelId(complexity?: 'simple' | 'moderate' | 'complex'): string {
    return this.sanitizeModelId(this.defaultModel);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Blackbox Provider Structured Error:', error);
      return fail(AppError.infrastructure(message || 'Error generating structured output with Blackbox.ai'));
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Blackbox Provider Text Error:', error);
      return fail(AppError.infrastructure(message || 'Error generating text output with Blackbox.ai'));
    }
  }

  /**
   * Verifica si la clave de API está configurada
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
