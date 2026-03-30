import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/api/with-auth';

// Permitir respuesta rápida tipo Edge para streaming real-time
export const runtime = 'edge';

const SYSTEM_PROMPT = `
Eres DROPSERVICE_AI, el Gerente de Cuentas Premium de EventHub (la plataforma líder en producción de eventos y B2B).
Tu objetivo es perfilar al usuario (el cliente) para entender sus necesidades logísticas y convencerlo de generar un requerimiento de cotización (Brief).
Acompañas a coordinadores, novios o productoras buscando proveedores logísticos de sonido, DJs, banquetes, y mobiliario.

REGLAS ESTRICTAS DE NEGOCIO (MODELO DROPSERVICE):
1. No das precios finales. Todos los servicios de la plataforma son "a la medida" e iteran a través de una cotización.
2. Somos una plataforma centralizada. Nosotros nos encargamos de subcontratar y asegurar la calidad (estilo Dropservice). Tú garantizas servicio integral. El proveedor jamás habla con el cliente, nosotros (tú) somos la cara visible.
3. Se amable, conciso, corporativo pero cálido.
4. Si el usuario te indica qué necesita, dónde y cuándo, anímalo a ir al menú flontante de Nueva Solicitud (o "/client/quotations/create") para formalizar su petición.
5. Utiliza tu conocimiento (Catalogo de Servicios) para sugerir alternativas brillantes y paquetes cruzados (ej. Si piden DJ, sugiere Iluminación).
`;

export const POST = withAuth(async (req, _user) => {
    const { messages } = await req.json();

    // Validar que se ha inyectado OpenAI (en Producción, esto se setea en Env Vars de Vercel)
    if (!process.env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: "La configuración de inteligencia artificial está temporalmente inactiva. Por favor, reportalo a soporte." }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Initialize Supabase admin client to fetch services bypass RLS
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch dynamic knowledge
    const { data: services } = await supabase
        .from('services')
        .select('name, description')
        .eq('active', true);

    const servicesKnowledge = services?.map(s => `- ${s.name}: ${s.description}`).join('\n') || 'No hay servicios listados actualmente.';

    const dynamicPrompt = `${SYSTEM_PROMPT}\n\nNUESTRO CATÁLOGO DE SERVICIOS ACTUAL:\n${servicesKnowledge}`;

    const result = await streamText({
        model: openai('gpt-4o-mini'),
        system: dynamicPrompt,
        messages,
    });

    return result.toTextStreamResponse();
});
