# Plan de Implementación de la Solución Integral E2E

El plan es impecable, sigue los principios SOLID y ataca directamente la raíz técnica de la deuda de arquitectura que detectamos. Sin embargo, antes de empezar, he revisado a detalle y preparé unas notas críticas.

### 🏛️ 1. Observaciones de Arquitectura Senior (Antigravity Prime)

1.  **Inyección de Dependencias (Fase 1 vs Fase 2):**
    *   En la **Fase 1** propones usar `tsyringe` (`@injectable`, `@inject`).
    *   En la **Fase 2** usas una **Factoría Manual** (`getCatalogService()`) para inyectarlo en los Server Actions.
    *   **Mi Recomendación:** En el ecosistema de Next.js (Server Actions y Edge/Serverless Functions), las librerías de DI basadas en decoradores como `tsyringe` a veces sufren por no preservar el estado global de Reflection o por instanciación múltiple en modo desarrollo (HMR). La **Factoría Manual (Fase 2)** que propones es extremadamente robusta, escalable y sin _overhead_ para Server Components. Te sugiero eliminar `tsyringe` de la Ecuación por ahora. Mantenemos clases puras y Factories.

2.  **Supabase Storage Bucket (`media`) (Fase 5):**
    *   Daremos por hecho que crearemos (o ya existe) un bucket público llamado `media` en Supabase.
    *   Haremos _upload_ delegándolo del cliente al API (`/api/upload`). Esto es seguro, ya que oculta la Server Key, pero consume ancho de banda de Vercel. Si el proyecto crece, el _Direct Upload_ desde el navegador a Supabase usando RLS sería ideal; pero por ahora, el _Proxy_ que propones (`/api/upload`) es perfecto y rápido de implementar.

3.  **Refactor del `CatalogItemForm` (Fase 4 vs Acciones):**
    *   Anteriormente, el formulario enviaba JSON validado por _React Hook Form_ directamente a la acción del servidor. En tu propuesta, pasas a serializarlo explícitamente a `FormData`.
    *   **Mi Recomendación:** Es un buen rediseño para permitir adjuntar _files_ nativos si fuera el caso, pero como usamos `/api/upload` de forma independiente (que retorna la URL), el formulario modal solo maneja la _URL final_. Mandarlo como un JSON serializado mediante Actions (ej. `await createCatalogItemAction({ ...data, images: urls })`) es aún más seguro y tipeable end-to-end con Zod. Sin embargo, podemos ir por la vía de `FormData` que diseñaste.

### 🚀 2. Ejecución (Pair Programming)

Estoy 100% de acuerdo con tu **Orden de Ejecución Recomendado**:

1.  ✅ **Fase 5:** Implementar `/api/upload` (Storage vital para desbloquear imágenes).
2.  ✅ **Fase 1:** Unificar y refactorizar `CatalogService.ts` (Single Source of Truth de negocio).
3.  ✅ **Fase 2:** Refactorizar Server Actions (`actions/catalog.ts`) con Zod schemas estructurados y Factors de Inyección.
4.  ✅ **Fase 4:** Crear `MediaUploader.tsx` y repulir `CatalogItemForm.tsx`.
5.  ✅ **Fase 3:** Actualizar retrocompatibilidad en `/api/services/route.ts` (Landing Page API Fix).
6.  ✅ **Testing E2E.**

¿Quieres que empiece ahora mismo con las Fases 5 y 1 enviándote el código para tu revisión?
