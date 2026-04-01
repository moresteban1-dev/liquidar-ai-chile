# SPRINT 5: Event Configuration Intelligence Engine

**Status:** Completado
**Periodo:** Marzo 2026
**Autor:** Antigravity Prime
**Enfoque:** Construcción del "Moat" (Foso Defensivo) Topológico

## Visión General
En este Sprint abandonamos el patrón clásico de "catálogo rígido estilo e-commerce" para evolucionar Dropservice hacia una plataforma impulsada por IA Causal. Diseñamos un **Motor de Inteligencia de Configuración Topológica** que calcula dinámicamente qué equipos y servicios requiere un evento basándose en su tipología, dimensiones y cantidad de asistentes.

## Arquitectura Implementada

### 1. The Knowledge Graph (BD Relacional)
Construimos un esquema relacional con Supabase (PostgreSQL) optimizado para representar un grafo dirigido de dependencias:
- **`event_types`**: Las "semillas" del grafo (Ej: Convención Corporativa).
- **`service_nodes`**: Los nodos abstractos de servicio (Ej: "Módulo Escenario 2x2" o "Baños VIP").
- **`event_type_node_mappings`**: Relaciona qué nodos base obligatorios dispara cada semilla.
- **`service_dependencies`**: Las aristas (edges) críticas. Si el nodo A (PA System) existe, se dispara el nodo B (Stage) con un razonamiento ("Mejora visibilidad").
- **`scaling_rules`**: Funciones matemáticas (`LINEAR`, `STEP`, `FIXED`) que actúan sobre variables (`ATTENDEES`, `SQUARE_METERS`) para escalar cantidades (Ej: "1 baño cada 150 pax").

> [!TIP]
> **Patrón**: Usamos RLS estricto desde el inicio para separar roles de Administración (escritura del grafo) de roles Públicos (lectura/uso del motor).

### 2. El Inferencia Pipeline (Core SDK)
Adoptamos un patrón **Pipes & Filters** desacoplando la lógica de negocio de la UI:
- **`BaseMappingStage`**: Obtiene las constantes del nivel cero (los "Must Haves" del EventType).
- **`DependencyResolutionStage`**: Atraviesa dependencias de N Nivel (las sugerencias cruzadas).
- **`QuantityScalingStage`**: Toma toda la matemática definida en las tablas, y procesa cada "Quantity" para no depender de inputs estáticos.
- **`SupabaseKnowledgeGraphRepository`**: Adapta nuestra capa de abstracción a queries eficientes contra la base de datos de datos de Supabase.

### 3. Wizard UI & Server Actions 
Diseñamos un Action `generateIntelligentConfiguration` sobrecargado con protección Zod.
El Wizard final (`/wizard`) provee una pantalla inmersiva (con Framer Motion y una paleta moderna) donde el usuario ingresa sus variables base `[Aforo, Duración]` y la plataforma visualiza dinámicamente la "lluvia" de nodos logísticos inferidos, acompañados de "Confianza %" y "Razonamientos" semánticos por cada cálculo.

## Siguientes Pasos (Next Sprints)
1. **Providers Matching AI:** Una vez que el Event Engine produce la lista de nodos perfectos (Ej: Necesitamos 4 PA Systems), el sistema debe conectarlo directamente vía geolocalización e inventario al módulo de Providers (RFP Automático).
2. **Fintech / Pagos Inteligentes:** Abordar Stripe Connect (o similar) para retención de fondos automatizada (Escrow) de los Dropservicers en la etapa de finalización.

## Verificación
Todo el código es "Environment-Agnostic" y vive sobre Next 15 Server Components, Vercel standard, y el driver nativo de Supabase SSR.
