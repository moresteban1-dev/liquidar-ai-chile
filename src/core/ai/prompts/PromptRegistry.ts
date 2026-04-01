import { InferredNeed, EventProfile } from '../../domain/event-intelligence/types';
import { CatalogItem } from '../../domain/catalog/CatalogTypes';

export type PromptTemplate<T = unknown> = (context: T) => string;

export const PROMPTS = {
    SUPERVISOR_ROUTING: {
        v1: (ctx: { systemPrompt: string; data: Record<string, unknown>; lastMessage: string }) => `
${ctx.systemPrompt}

[CONTEXT DATA]
${JSON.stringify(ctx.data, null, 2)}

[LAST MESSAGE]
${ctx.lastMessage}

Task: Decide the next agent.
Output JSON: { "next": "Negotiator" | "QA" | "User", "reasoning": "string" }
    `.trim()
    },

    GENERAL_CHAT: {
        v1: (ctx: { data: Record<string, unknown>; history: string; lastMessage: string }) => `
You are a helpful assistant for the Drop-Servicing Platform.
Context: ${JSON.stringify(ctx.data)}
History: ${ctx.history}

User said: ${ctx.lastMessage}

Respond helpfully.
    `.trim()
    },

    CATALOG_MATCHING: {
        v1: (ctx: { profile: EventProfile; requestedItems: InferredNeed[]; catalog: CatalogItem[] }) => `
Eres un Experto en Operaciones y Logística para una plataforma de Drop-Servicing.
Tu objetivo es mapear los requerimientos de un cliente (Perfil del Evento e Ítems Inferidos) hacia los servicios técnicos disponibles en nuestro Catálogo.

[EVENT PROFILE]
${JSON.stringify(ctx.profile, null, 2)}

[REQUESTED ITEMS]
${JSON.stringify(ctx.requestedItems, null, 2)}

[CATALOG CONTEXT]
${JSON.stringify(ctx.catalog, null, 2)}

TAREA:
1. Para cada ítem solicitado, encuentra el mejor "match" en el catálogo.
2. Si no hay un match exacto, busca el servicio más cercano que pueda cubrir la necesidad.
3. Propón una estructura de costos (Concepto, Cantidad, Precio Unitario Neto, Categoría: SERVICIO o LOGISTICA).
4. Genera también la descripción final que verá el cliente.

FORMATO DE SALIDA:
Debes responder estrictamente en formato JSON siguiendo el esquema proporcionado.
    `.trim()
    },

    NEGOTIATOR_ANALYSIS: {
        v1: (ctx: { serviceCategory: string; marketRate: number; priceCost: number; deviation: string }) => `
Eres un Negociador Senior para una plataforma de servicios.
Analiza la siguiente oferta:
Categoría: ${ctx.serviceCategory}
Precio Mercado Est.: ${ctx.marketRate}
Precio Propuesto: ${ctx.priceCost}
Desviación: ${ctx.deviation}%

Tarea: Decide si aprobamos, rechazamos o negociamos.
Output JSON: { "decision": "APPROVE" | "REJECT" | "NEGOTIATE", "reasoning": "string", "suggestedCounterOffer": number, "replyToUser": "string" }
        `.trim()
    },

    QA_REVIEW: {
        v1: (ctx: { briefContent: string; deliverableType: string; deliverableContent: string }) => `
Eres un Auditor de Calidad (QA Sentinel).
Revisa si el entregable cumple con el brief:
Brief: ${ctx.briefContent}
Tipo: ${ctx.deliverableType}
Contenido: ${ctx.deliverableContent}

Output JSON: { "score": number, "passed": boolean, "feedback": "string", "requiredChanges": ["string"] }
        `.trim()
    },

    BIAS_ANALYSIS: {
        v1: (ctx: { depth: string; language: string; content: string }) => `
Eres un Analista Forense de Sesgos Cognitivos y Éticos.
Analiza el siguiente contenido buscando sesgos de género, raza, edad, o socioeconómicos.
Nivel de profundidad: ${ctx.depth}
Idioma de respuesta: ${ctx.language}

Contenido a analizar:
${ctx.content}

Output JSON: BiasAnalysisOutput schema.
        `.trim()
    },

    SERVICE_MATCHING: {
        v1: (ctx: { items: any[]; categories: string[] }) => `
Eres un Orquestador de Servicios de Drop-servicing.
Tu tarea es emparejar los ítems solicitados con las categorías disponibles.
Categorías disponibles: ${ctx.categories.join(', ')}

Ítems a mappear:
${JSON.stringify(ctx.items, null, 2)}

Output JSON: ServiceMatchingOutput schema.
        `.trim()
    }
};

export class PromptRegistry {
    static get<K extends keyof typeof PROMPTS, V extends keyof (typeof PROMPTS)[K]>(
        key: K,
        version: V
    ): (typeof PROMPTS)[K][V] {
        const promptSet = PROMPTS[key];
        if (!promptSet) {
            throw new Error(`Prompt missing: ${key}`);
        }
        const template = promptSet[version];
        if (!template) {
            throw new Error(`Prompt version missing: ${key} v${String(version)}`);
        }
        return template;
    }
}
