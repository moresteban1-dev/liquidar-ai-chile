import type { Result } from '@core/shared/Result';
import type { AppError } from '@core/shared/AppError';
import type { AIProviderType } from '@core/domain/tools/tool-execution.types';
import { z } from 'zod';

/** Contrato para proveedores de IA intercambiables */
export interface IAIToolProvider {
  readonly providerType: AIProviderType;
  
  /** Genera un objeto estructurado a partir de un prompt */
  generateStructured<T>(params: {
    prompt: string;
    systemPrompt?: string;
    outputSchema: z.ZodType<T>;
    temperature?: number;
    maxTokens?: number;
    complexity?: 'simple' | 'moderate' | 'complex';
  }): Promise<Result<T, AppError>>;

  /** Genera texto libre (para contenido largo) */
  generateText(params: {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    complexity?: 'simple' | 'moderate' | 'complex';
  }): Promise<Result<string, AppError>>;

  /** Verifica si el proveedor está disponible */
  isAvailable(): Promise<boolean>;
}
