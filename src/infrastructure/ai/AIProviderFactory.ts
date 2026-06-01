import type { IAIToolProvider } from '@core/application/ports/IAIToolProvider';
import type { AIProviderType } from '@core/domain/tools/tool-execution.types';
import { GeminiToolProvider } from './providers/GeminiToolProvider';
import { OpenAIToolProvider } from './providers/OpenAIToolProvider';
import { AnthropicToolProvider } from './providers/AnthropicToolProvider';
import { PerplexityToolProvider } from './providers/PerplexityToolProvider';
import { GroqToolProvider } from './providers/GroqToolProvider';
import { BlackboxToolProvider } from './providers/BlackboxToolProvider';
import { AppError } from '@core/shared/AppError';
import { createClient } from '@/lib/supabase/server';
import { decryptConfig } from '@/lib/payments/encryption';

/**
 * Fábrica de Proveedores de IA Dinámica y Resiliente
 * Resuelve y cachea los adaptadores cognitivos a partir de la configuración
 * en la base de datos de Supabase con desencriptación militar y fallback automático.
 */
export class AIProviderFactory {
  // Caché en memoria para instancias cálidas (Warm Instantiation Cache)
  private static activeInstances: Map<string, IAIToolProvider> = new Map();

  /**
   * Obtiene y resuelve dinámicamente un proveedor de IA
   */
  static async getProvider(type: AIProviderType = 'gemini'): Promise<IAIToolProvider> {
    try {
      // 1. Verificar si ya está en el caché en memoria
      const cached = this.activeInstances.get(type);
      if (cached) {
        return cached;
      }

      // 2. Intentar cargar desde la Base de Datos (Supabase)
      const supabase = await createClient();
      const { data: dbConfig, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('slug', type)
        .single();

      if (!error && dbConfig) {
        // Encontrado en Base de Datos
        if (dbConfig.is_active) {
          // Desencriptar la API Key sensible utilizando la llave criptográfica AES
          let decryptedKey = '';
          if (dbConfig.api_key) {
            try {
              const decrypted = decryptConfig({ api_key: dbConfig.api_key });
              decryptedKey = String(decrypted.api_key || '');
            } catch (decErr) {
              console.error(`[AIProviderFactory] Error desencriptando API Key para ${type}:`, decErr);
            }
          }

          // Si hay una API key desencriptada válida, instanciar el proveedor
          if (decryptedKey) {
            const provider = this.instantiateProvider(type, decryptedKey, dbConfig.default_model);
            if (provider) {
              this.activeInstances.set(type, provider);
              return provider;
            }
          }
        }
      }

      // 3. FALLBACK SEGURO 1: Si no está activo en la BD, verificar variables de entorno locales (.env)
      const envKey = this.getEnvKeyForProvider(type);
      if (envKey) {
        const provider = this.instantiateProvider(type, envKey);
        if (provider) {
          console.warn(`[AIProviderFactory] Usando proveedor ${type} desde variable de entorno (.env) como resiliencia.`);
          this.activeInstances.set(type, provider);
          return provider;
        }
      }

      // 4. FALLBACK SEGURO 2: Buscar el primer proveedor que esté activo en la Base de Datos
      const { data: allProviders } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('is_active', true);

      if (allProviders && allProviders.length > 0) {
        // Encontrar el primer activo alternativo
        const fallbackConfig = allProviders[0];
        const fallbackType = fallbackConfig.slug as AIProviderType;

        let decryptedKey = '';
        if (fallbackConfig.api_key) {
          try {
            const decrypted = decryptConfig({ api_key: fallbackConfig.api_key });
            decryptedKey = String(decrypted.api_key || '');
          } catch {}
        }

        if (decryptedKey) {
          const provider = this.instantiateProvider(fallbackType, decryptedKey, fallbackConfig.default_model);
          if (provider) {
            console.warn(`[AIProviderFactory] Enrutador inteligente: ${type} inactivo. Redirigiendo a ${fallbackType}.`);
            return provider;
          }
        }
      }

      // 5. FALLBACK SEGURO FINAL: Si todo lo demás falla, usar Gemini por defecto con su variable de entorno
      const finalGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
      if (finalGeminiKey) {
        const geminiProvider = new GeminiToolProvider(finalGeminiKey);
        this.activeInstances.set('gemini', geminiProvider);
        console.warn(`[AIProviderFactory] Resiliencia Final: Inicializado Google Gemini por variables estáticas.`);
        return geminiProvider;
      }

      throw AppError.infrastructure('Ningún proveedor de IA está activo ni configurado.');
    } catch (err: any) {
      console.error('[AIProviderFactory] Excepción fatal resolviendo proveedor:', err);
      // Retornar Gemini estático si hay credenciales para mitigar caídas en producción
      const fallbackKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
      if (fallbackKey) {
        return new GeminiToolProvider(fallbackKey);
      }
      throw AppError.infrastructure(`Error crítico en la infraestructura de IA: ${err.message}`);
    }
  }

  /**
   * Instancia el adaptador concreto correspondiente
   */
  private static instantiateProvider(
    type: AIProviderType, 
    apiKey: string, 
    defaultModel?: string
  ): IAIToolProvider | null {
    switch (type) {
      case 'gemini':
        return new GeminiToolProvider(apiKey);
      case 'openai':
        return new OpenAIToolProvider(apiKey, defaultModel || 'gpt-4o-mini');
      case 'claude':
        return new AnthropicToolProvider(apiKey, defaultModel || 'claude-3-5-sonnet-20241022');
      case 'perplexity':
        return new PerplexityToolProvider(apiKey, defaultModel || 'sonar-medium-online');
      case 'groq':
        return new GroqToolProvider(apiKey, defaultModel || 'llama3-70b-8192');
      case 'blackbox':
        return new BlackboxToolProvider(apiKey, defaultModel || 'blackboxai/blackbox-pro');
      default:
        return null;
    }
  }

  /**
   * Resuelve variables de entorno locales de fallback rápido
   */
  private static getEnvKeyForProvider(type: AIProviderType): string | undefined {
    switch (type) {
      case 'gemini':
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'claude':
        return process.env.ANTHROPIC_API_KEY;
      case 'perplexity':
        return process.env.PERPLEXITY_API_KEY;
      case 'groq':
        return process.env.GROQ_API_KEY;
      case 'blackbox':
        return process.env.BLACKBOX_API_KEY;
      default:
        return undefined;
    }
  }

  /**
   * Borra el caché de instancias cuando ocurre una modificación
   */
  static clearCache() {
    this.activeInstances.clear();
  }
}
