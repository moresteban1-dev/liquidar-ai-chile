import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptConfig, decryptConfig } from '@/lib/payments/encryption';
import { withAdmin } from '@/lib/api/with-auth';
import { AIProviderFactory } from '@infrastructure/ai/AIProviderFactory';

export const runtime = 'edge';

// GET: Listar todos los proveedores de IA con credenciales desencriptadas para el Admin
export const GET = withAdmin(async () => {
    try {
        const supabase = await createClient();

        const { data: providers, error } = await supabase
            .from('ai_providers')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        // Desencriptar claves API para rellenar formulario en Admin UI
        const decryptedProviders = (providers || []).map((provider: any) => {
            if (provider.api_key) {
                try {
                    const decrypted = decryptConfig({ api_key: provider.api_key });
                    return {
                        ...provider,
                        api_key: decrypted.api_key || ''
                    };
                } catch {
                    logger.error("Failed to decrypt AI provider key for slug:", provider.slug);
                    return { ...provider, api_key: '' };
                }
            }
            return provider;
        });

        return NextResponse.json({ providers: decryptedProviders });
    } catch (err: any) {
        logger.error('Error in GET /api/admin/ai-providers:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
});

// PUT: Actualizar un proveedor de IA (activar/desactivar, cambiar clave, cambiar modelo)
export const PUT = withAdmin(async (request) => {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { provider_id, is_active, default_model, api_key } = body;

        if (!provider_id) {
            return NextResponse.json({ error: 'provider_id es requerido' }, { status: 400 });
        }

        // Obtener el proveedor actual
        const { data: existing, error: existErr } = await supabase
            .from('ai_providers')
            .select('slug, api_key')
            .eq('id', provider_id)
            .single();

        if (existErr || !existing) {
            return NextResponse.json({ error: 'Proveedor de IA no encontrado' }, { status: 404 });
        }

        // Si se va a activar, validar credenciales
        const keyToUse = api_key !== undefined ? api_key : (existing.api_key ? decryptConfig({ api_key: existing.api_key }).api_key : '');
        if (is_active === true && !keyToUse) {
            return NextResponse.json({ error: 'Se requiere una API Key para activar este proveedor.' }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        if (is_active !== undefined) updateData.is_active = is_active;
        if (default_model !== undefined) updateData.default_model = default_model;
        
        if (api_key !== undefined) {
            // Encriptar la clave de API sensible antes de guardar en Base de Datos
            if (api_key) {
                const encrypted = encryptConfig({ api_key });
                updateData.api_key = encrypted.api_key;
            } else {
                updateData.api_key = null;
            }
        }

        const { data, error } = await supabase
            .from('ai_providers')
            .update(updateData)
            .eq('id', provider_id)
            .select()
            .single();

        if (error) throw error;

        // Limpiar el caché de la fábrica de proveedores para forzar reinstanciación
        AIProviderFactory.clearCache();

        return NextResponse.json({
            success: true,
            provider: data,
            message: `Proveedor ${data.name} actualizado exitosamente.`
        });
    } catch (err: any) {
        logger.error('Error in PUT /api/admin/ai-providers:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
});

// POST: Probar conexión y latencia de API en tiempo real (Test Connection)
export const POST = withAdmin(async (request) => {
    try {
        const body = await request.json();
        const { slug, api_key, default_model } = body;

        if (!slug || !api_key) {
            return NextResponse.json({ error: 'slug y api_key son requeridos para probar conexión' }, { status: 400 });
        }

        // Instanciar proveedor efímero para probar la llamada
        const factory = AIProviderFactory as any;
        const provider = factory.instantiateProvider(slug, api_key, default_model);

        if (!provider) {
            return NextResponse.json({ error: `No se pudo instanciar el proveedor para slug: ${slug}` }, { status: 400 });
        }

        const startTime = Date.now();
        const testResult = await provider.generateText({
            prompt: 'ping',
            systemPrompt: 'Responde únicamente con "pong" de forma ultra-corta.',
            temperature: 0.1,
            maxTokens: 5
        });
        const duration = Date.now() - startTime;

        if (testResult.isFailure()) {
            return NextResponse.json({
                success: false,
                error: testResult.getError().message || 'Error de conexión de la API'
            });
        }

        return NextResponse.json({
            success: true,
            latencyMs: duration,
            message: 'Conexión probada con éxito.'
        });
    } catch (err: any) {
        logger.error('Error in POST /api/admin/ai-providers:', err);
        return NextResponse.json({ success: false, error: err.message || 'Excepción de Red/Infraestructura' });
    }
});
