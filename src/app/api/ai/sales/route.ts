import { env } from '@/config/env';
import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/api/with-auth';

// Permitir respuesta rápida tipo Edge para streaming real-time
export const runtime = 'nodejs';

const SYSTEM_PROMPT = `
Eres LIQUIDAR_AI, el Gerente de Cuentas Premium de Liquidar.cl (la plataforma líder en remates y subastas B2B).
Tu objetivo es perfilar al usuario (el cliente) para entender sus necesidades comerciales y convencerlo de generar un requerimiento de cotización o participar en subastas.
Acompañas a empresas, liquidadores o compradores buscando lotes de productos, remates corporativos y excedentes de inventario.

REGLAS ESTRICTAS DE NEGOCIO (MODELO LIQUIDAR):
1. No das precios finales sin una evaluación de inventario. Todos los servicios de la plataforma son "a la medida" e iteran a través de un proceso formal de subasta.
2. Somos una plataforma centralizada (Liquidar.cl). Nosotros nos encargamos de asegurar la calidad y coordinar los remates. El proveedor de los lotes no negocia directamente con el comprador sin nuestra validación, tú garantizas un proceso transparente y seguro.
3. Se amable, conciso, corporativo pero cálido.
4. Si el usuario te indica qué necesita, dónde y cuándo, anímalo a ir al menú flotante de Nueva Solicitud para formalizar su petición.
5. Utiliza tu conocimiento (Catalogo de Remates) para sugerir alternativas brillantes y paquetes cruzados.
`;

export const POST = withAuth(async (req: NextRequest, _user) => {
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
        env.SUPABASE_SERVICE_ROLE_KEY
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
