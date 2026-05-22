import type { IAIToolProvider } from '@core/application/ports/IAIToolProvider';
import type { AIProviderType } from '@core/domain/tools/tool-execution.types';
import { GeminiToolProvider } from './providers/GeminiToolProvider';

/**
 * AI Provider Factory
 * Permite instanciar dinámicamente diferentes modelos de IA
 * basado en la configuración o las preferencias del usuario/herramienta.
 * 
 * Preparado para extenderse con Perplexity, Claude y OpenAI.
 */
export class AIProviderFactory {
  private static providers: Map<AIProviderType, IAIToolProvider> = new Map();

  /**
   * Inicializa los proveedores configurados
   */
  static initialize() {
    // Inicializar Gemini por defecto (MVP)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.providers.set('gemini', new GeminiToolProvider(geminiApiKey));
    }

    // Aquí en el futuro inicializaremos Perplexity
    // const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    // if (perplexityApiKey) {
    //   this.providers.set('perplexity', new PerplexityToolProvider(perplexityApiKey));
    // }
  }

  /**
   * Obtiene un proveedor específico
   */
  static getProvider(type: AIProviderType = 'gemini'): IAIToolProvider {
    // Si no está inicializado, intentamos inicializar
    if (this.providers.size === 0) {
      this.initialize();
    }

    const provider = this.providers.get(type);
    
    if (!provider) {
      // Fallback a Gemini si el solicitado no está disponible
      const fallback = this.providers.get('gemini');
      if (fallback) {
        console.warn(`Provider ${type} not available. Falling back to Gemini.`);
        return fallback;
      }
      throw new Error(`No AI provider available. Check API keys.`);
    }

    return provider;
  }

  /**
   * Sugiere el mejor proveedor para un tipo de tarea específica
   */
  static getBestProviderForTask(taskType: 'search' | 'reasoning' | 'generation' | 'code'): IAIToolProvider {
    switch (taskType) {
      case 'search':
        // En el futuro devolveríamos Perplexity aquí
        // return this.getProvider('perplexity');
        return this.getProvider('gemini');
      case 'reasoning':
        // En el futuro podríamos devolver Claude aquí
        return this.getProvider('gemini');
      case 'generation':
        return this.getProvider('gemini');
      case 'code':
        return this.getProvider('openai'); // Placeholder para OpenAI/Codex
      default:
        return this.getProvider('gemini');
    }
  }
}
