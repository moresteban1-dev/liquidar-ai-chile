import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole';

export const runtime = 'nodejs'; // Use node engine for edge stability or bullmq 

export const POST = withAuth(async (req: NextRequest, user) => {
    const { messages, quotationId, role: bodyRole } = await req.json();

    // El rol debe venir preferiblemente del perfil real del usuario, pero usamos el context solicitado si tiene los permisos
    const userRole = normalizeRole(user.role);
    const targetRole = normalizeRole(bodyRole);

    // Validar que el usuario tiene acceso al rol solicitado en el chat
    if (targetRole === UserRole.ADMIN && userRole !== UserRole.ADMIN) {
        return new Response('Forbidden: Admin access required', { status: 403 });
    }
    if (targetRole === UserRole.VENDOR && userRole !== UserRole.VENDOR && userRole !== UserRole.ADMIN) {
        return new Response('Forbidden: Vendor or Admin access required', { status: 403 });
    }

    const supabase = createServiceRoleClient();

    // 1. Validar accesos según rol
    const { data: quotation } = await supabase
        .from('quotations')
        .select(`
        code, total_provider_net, internal_notes, service_id,
        services(name)
    `)
        .eq('id', quotationId)
        .single();

    if (!quotation) {
        return new Response('Quotation context missing', { status: 404 });
    }

    const servicesData = quotation.services as any;
    let serviceCategory = 'Servicio General';
    if (Array.isArray(servicesData) && servicesData.length > 0) {
        serviceCategory = servicesData[0]?.name || 'Servicio General';
    } else if (servicesData && typeof servicesData === 'object' && 'name' in servicesData) {
        serviceCategory = (servicesData as any).name;
    }

    // 2. Definir sistema según rol de quien consulta
    let systemPrompt = '';
    if (targetRole === UserRole.ADMIN) {
        systemPrompt = `Eres el 'Negotiator AI', el asistente interno de la junta directiva de DropService. Estás monitoreando la cotización ${quotation.code} (${serviceCategory}).
El costo neto del proveedor es de $${quotation.total_provider_net || 0}.
Tus notas internas generadas asíncronamente dictan: ${quotation.internal_notes || 'Ninguna'}.
El Administrador conversará contigo para recibir consejos de negociación o pedirte que asistas en aumentar el markup de ganancias. Responde concisamente.`;
    } else if (targetRole === UserRole.VENDOR) {
        systemPrompt = `Eres el asistente de compras de DropService. Estás negociando una cotización (${serviceCategory}) con el proveedor. 
El presupuesto que remitió es de $${quotation.total_provider_net || 0}.
Debes negociar para bajar amablemente el precio al menos un 10% si parece alto, justificándote en el volumen garantizado que provee la plataforma Dropservice a la larga.
Se profesional, estricto con los números, pero muy cortés.`;
    } else {
        return new Response('Role Context Error', { status: 400 });
    }

    // 3. Generar la respuesta Stream 
    const response = streamText({
        model: openai('gpt-4o'),
        system: systemPrompt,
        messages,
    });

    return response.toTextStreamResponse();
});
