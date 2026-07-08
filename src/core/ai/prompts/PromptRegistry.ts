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
        v1: (ctx: { items: unknown[]; categories: string[] }) => `
Eres un Orquestador de Servicios de Drop-servicing.
Tu tarea es emparejar los ítems solicitados con las categorías disponibles.
Categorías disponibles: ${ctx.categories.join(', ')}

Ítems a mappear:
${JSON.stringify(ctx.items, null, 2)}

Output JSON: ServiceMatchingOutput schema.
        `.trim()
    },

    // ═══════════════════════════════════════════════════════════
    // MÓDULO HERRAMIENTAS IA — Prompts para el Admin Dashboard
    // ═══════════════════════════════════════════════════════════

    COMPETITIVE_ANALYSIS: {
        v1: (ctx: {
            businessName: string;
            industry: string;
            location: string;
            targetMarket: string;
            competitors: string;
            analysisScope: string[];
        }) => `
Eres un Consultor Senior de Inteligencia Competitiva con experiencia en análisis de mercado multi-rubro.
Tu especialidad es extraer patrones accionables de datos cualitativos de competidores.

[CONTEXTO DEL NEGOCIO]
Nombre: ${ctx.businessName}
Industria/Rubro: ${ctx.industry}
Ubicación: ${ctx.location}
Mercado Objetivo: ${ctx.targetMarket || 'No especificado'}
Alcance del Análisis: ${ctx.analysisScope.join(', ')}

[DATOS DE COMPETIDORES]
${ctx.competitors}

TAREA:
Realiza un análisis competitivo exhaustivo con los datos proporcionados. Debes:

1. PERFILES DE COMPETIDORES: Para cada competidor, identifica sus diferenciadores, fortalezas, debilidades y posicionamiento de precio.

2. PATRONES EN RESEÑAS: Extrae patrones recurrentes tanto positivos como negativos. Clasifica cada patrón por frecuencia (raro, ocasional, frecuente, dominante) e implicación para el negocio.

3. QUEJAS FRECUENTES: Lista las quejas más comunes que los clientes tienen sobre los competidores.

4. OPORTUNIDADES DE MEJORA: Identifica áreas donde todos los competidores fallan o son mediocres.

5. GAPS DE MERCADO: Detecta necesidades no cubiertas por ningún competidor. Clasifica por dificultad de implementación e impacto potencial.

6. INSIGHTS ACCIONABLES: Genera insights específicos categorizados por área (producto, marketing, pricing, servicio, operaciones) con prioridad, esfuerzo y resultado esperado.

7. RECOMENDACIONES COMERCIALES: Propón estrategias concretas para superar a la competencia en ${ctx.industry}.

8. IDEAS DE CONTENIDO: Sugiere ideas de contenido (blog, redes sociales, video, caso de estudio) basadas en los gaps detectados.

9. OFERTAS COMPETITIVAS: Propón ofertas o propuestas de valor que superen a las de los competidores.

10. RESUMEN EJECUTIVO: Un párrafo de síntesis con las 3 conclusiones más importantes.

REGLAS:
- Sé específico para el rubro "${ctx.industry}" en "${ctx.location}".
- Cada insight debe ser accionable, no genérico.
- Prioriza hallazgos por impacto comercial.
- Responde estrictamente en formato JSON siguiendo el esquema proporcionado.
        `.trim()
    },

    PROMPT_EVALUATION: {
        v1: (ctx: {
            originalPrompt: string;
            businessContext: string;
            category: string;
            targetAudience: string;
            desiredOutput: string;
        }) => `
Eres un Meta-Ingeniero de Prompts de nivel experto. Tu especialidad es evaluar, diagnosticar y optimizar prompts de negocio.

PRINCIPIO FUNDAMENTAL: "Quien mejor describe el problema, obtiene mejores insights."

[PROMPT A EVALUAR]
${ctx.originalPrompt}

[CONTEXTO]
Negocio: ${ctx.businessContext}
Categoría: ${ctx.category}
Audiencia Objetivo: ${ctx.targetAudience || 'No especificada'}
Output Deseado: ${ctx.desiredOutput || 'No especificado'}

TAREA COMPLETA:

1. EVALUACIÓN DE CALIDAD (6 dimensiones, cada una con score 0-100):
   - Claridad: ¿Se entiende exactamente qué se pide?
   - Especificidad: ¿Hay suficientes detalles y restricciones?
   - Contexto: ¿Se proporciona suficiente contexto de negocio?
   - Accionabilidad: ¿El resultado será directamente aplicable?
   - Medibilidad: ¿Se puede evaluar la calidad del resultado?
   - Completitud: ¿Falta información crucial?

2. PREGUNTAS FALTANTES: ¿Qué preguntas debería hacerse el usuario antes de ejecutar este prompt?

3. VARIABLES NO CONSIDERADAS: ¿Qué factores o variables ignoró el prompt que podrían afectar la calidad del resultado?

4. RIESGOS DE MALA INTERPRETACIÓN: ¿Dónde podría la IA malinterpretar la intención?

5. REFORMULACIÓN: Reescribe el prompt corrigiendo los problemas detectados pero manteniendo la intención original.

6. PROMPT MEJORADO: Versión significativamente mejorada con contexto, restricciones y formato de salida claros.

7. PROMPT EXPERTO: Versión de nivel consultor senior que un experto en "${ctx.category}" usaría.

8. VERSIONES POR PLATAFORMA:
   - Perplexity: Optimizado para búsqueda web con fuentes (añade instrucciones de búsqueda y citación).
   - Claude: Optimizado para análisis profundo y síntesis (aprovecha la ventana de contexto larga).
   - OpenAI/Codex: Optimizado para estructuración y automatización (enfoca en formato de salida preciso).

9. CHECKLIST DE CALIDAD: Lista de verificación con criterios pass/fail.

10. RESUMEN EJECUTIVO: Diagnóstico conciso del prompt y las 3 mejoras más impactantes.

REGLAS:
- El score global (qualityScore) es el promedio ponderado de las 6 dimensiones.
- Las versiones por plataforma deben aprovechar las fortalezas específicas de cada modelo.
- Responde en formato JSON siguiendo el esquema proporcionado.
        `.trim()
    },

    SEO_CONTENT_GENERATION: {
        v1: (ctx: {
            contentType: string;
            topic: string;
            industry: string;
            country: string;
            city: string;
            searchIntent: string;
            targetClientType: string;
            existingContent: string;
            targetKeywords: string[];
        }) => `
Eres un Arquitecto SEO Senior con expertise en contenido de alto rendimiento para "${ctx.industry}".
Tu objetivo es generar contenido que posicione en la primera página de Google para "${ctx.country}"${ctx.city ? ` (${ctx.city})` : ''}.

[PARÁMETROS]
Tipo de Contenido: ${ctx.contentType}
Tema: ${ctx.topic}
Industria: ${ctx.industry}
País: ${ctx.country}
Ciudad: ${ctx.city || 'Nacional'}
Intención de Búsqueda: ${ctx.searchIntent}
Tipo de Cliente Objetivo: ${ctx.targetClientType || 'General'}
Keywords Objetivo: ${ctx.targetKeywords?.length ? ctx.targetKeywords.join(', ') : 'Detectar automáticamente'}
${ctx.existingContent ? `\n[CONTENIDO EXISTENTE A OPTIMIZAR]\n${ctx.existingContent}` : ''}

TAREA COMPLETA:

1. TÍTULO SEO: Máximo 60 caracteres, incluye keyword principal, genera curiosidad o valor claro.

2. SLUG: URL amigable, corto, con keyword principal, sin acentos ni caracteres especiales.

3. META DESCRIPTION: 150-160 caracteres, incluye keyword y call-to-action implícito.

4. KEYWORDS:
   - Principales (3-5): Alto volumen de búsqueda en ${ctx.country}.
   - Secundarias (5-8): Variaciones y sinónimos.
   - Long-tail (5-10): Frases específicas de ${ctx.searchIntent}.

5. ESTRUCTURA DE HEADINGS: Árbol jerárquico H1 > H2 > H3 optimizado para featured snippets.

6. CONTENIDO: Genera el contenido completo en Markdown:
   - Mínimo 1200 palabras para artículos, 500 para descripciones.
   - Incluye la keyword principal en el primer párrafo.
   - Usa variaciones de keywords naturalmente.
   - Párrafos cortos (2-3 oraciones máximo).
   - Incluye listas y datos específicos.
   - Tono profesional pero accesible para ${ctx.industry}.

7. FAQs: 5-8 preguntas frecuentes optimizadas para fragmentos destacados de Google.

8. SCHEMA MARKUP: JSON-LD apropiado para el tipo de contenido (Article, FAQPage, LocalBusiness, Service, etc.).

9. INTERLINKING: Sugiere anchor texts y URLs internas relevantes para crear una red de contenido.

10. SEO LOCAL: Recomendaciones específicas para posicionamiento en ${ctx.city || ctx.country}.

11. SCORE: Autoevalúa el contenido generado (0-100) basado en densidad de keywords, legibilidad, estructura y completitud.

REGLAS:
- Adapta el tono y vocabulario al rubro "${ctx.industry}" en "${ctx.country}".
- No uses relleno ni contenido genérico.
- Cada sección debe aportar valor al lector.
- Responde en formato JSON siguiendo el esquema proporcionado.
        `.trim()
    },

    EXCEL_DATA_ENRICHMENT: {
        v1: (ctx: {
            templateType: string;
            columns: string[];
            sampleData: string;
            industry: string;
            enrichmentGoals: string[];
        }) => `
Eres un Analista de Datos de Negocio especializado en enriquecimiento de bases de datos comerciales.

[CONTEXTO]
Tipo de Base: ${ctx.templateType}
Industria: ${ctx.industry}
Columnas Disponibles: ${ctx.columns.join(', ')}
Objetivos de Enriquecimiento: ${ctx.enrichmentGoals.join(', ')}

[DATOS DE MUESTRA]
${ctx.sampleData}

TAREA:
Para cada registro proporcionado, enriquece los datos con:

1. CLASIFICACIÓN: Categoriza cada registro por industria, tamaño estimado y prioridad comercial (alta/media/baja).

2. SEGMENTACIÓN: Asigna un segmento de mercado basado en los datos disponibles.

3. CALIDAD DE DATOS: Evalúa la calidad de cada registro (completo, parcial, insuficiente) e identifica campos faltantes críticos.

4. DEDUPLICACIÓN: Detecta posibles duplicados basado en similitud de nombre, email o teléfono.

5. NORMALIZACIÓN: Sugiere correcciones de formato (teléfonos, emails, nombres de empresa).

REGLAS:
- Sé conservador en las clasificaciones: si no hay suficiente información, marca como "indeterminado".
- Prioriza la precisión sobre la cobertura.
- Responde en formato JSON siguiendo el esquema proporcionado.
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
