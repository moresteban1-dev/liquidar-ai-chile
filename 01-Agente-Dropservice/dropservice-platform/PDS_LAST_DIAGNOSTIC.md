# 🏥 Platform Diagnostic Report

**Date:** 2026-03-30T16:20:59.349Z
**Platform:** Dropservice Platform v0.1.1
**Overall Score:** 76/100 (Grade: B)
**Execution Time:** 7.2s

## Scanner Results

| Scanner | Score | Status | Findings | Duration |
|---------|-------|--------|----------|----------|
| typescript | 33/100 | ❌ | 135 | 6650ms |
| domain-integrity | 91/100 | ✅ | 5 | 57ms |
| infrastructure | 94/100 | ✅ | 2 | 135ms |
| security | 100/100 | ✅ | 0 | 334ms |
| performance | 64/100 | ✅ | 9 | 63ms |

## Findings Summary

- 🔴 Critical: 42
- 🟠 High: 46
- 🟡 Medium: 38
- 🔵 Low: 25

### typescript

- 🔵 **TS2367: This comparison appears to be unintentional because the types 'UserRole' and '"admin"' have no overl** — `src/app/admin/event-intelligence/test/page.tsx:12`
  - Revisar error TS2367 manualmente
- 🔵 **TS2367: This comparison appears to be unintentional because the types 'UserRole' and '"admin"' have no overl** — `src/app/admin/leads/[id]/page.tsx:15`
  - Revisar error TS2367 manualmente
- 🔵 **TS2367: This comparison appears to be unintentional because the types 'UserRole' and '"admin"' have no overl** — `src/app/admin/leads/page.tsx:10`
  - Revisar error TS2367 manualmente
- 🟡 **TS6133: 'useMemo' is declared but its value is never read.** — `src/app/admin/operations/hooks/useNotificationLogs.ts:1`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🔵 **TS2367: This comparison appears to be unintentional because the types 'UserRole' and '"admin"' have no overl** — `src/app/admin/operations/page.tsx:34`
  - Revisar error TS2367 manualmente
- 🟡 **TS6133: 'HealthData' is declared but its value is never read.** — `src/app/admin/operations/SystemHealthPanel.tsx:3`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟡 **TS6133: 'useMemo' is declared but its value is never read.** — `src/app/admin/orders/hooks/useSLARisks.ts:1`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟡 **TS6133: 'OrderData' is declared but its value is never read.** — `src/app/admin/orders/hooks/useSLARisks.ts:4`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟠 **TS2322: Type '"ADMIN"' is not assignable to type 'UserRole'.** — `src/app/admin/quotations/[id]/AdminQuotationDetailClient.tsx:291`
  - Verificar compatibilidad de tipos en asignación
- 🔵 **TS2367: This comparison appears to be unintentional because the types 'UserRole' and '"admin"' have no overl** — `src/app/admin/quotations/page.tsx:13`
  - Revisar error TS2367 manualmente
- 🔴 **TS2304: Cannot find name 'handleError'.** — `src/app/api/admin/feature-flags/route.ts:27`
  - Agregar import faltante o instalar @types package
- 🔴 **TS2304: Cannot find name 'handleError'.** — `src/app/api/admin/feature-flags/route.ts:65`
  - Agregar import faltante o instalar @types package
- 🟡 **TS6133: 'req' is declared but its value is never read.** — `src/app/api/admin/stats/analytics/route.ts:13`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟡 **TS6133: 'user' is declared but its value is never read.** — `src/app/api/admin/stats/analytics/route.ts:13`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟡 **TS6133: 'user' is declared but its value is never read.** — `src/app/api/ai/agent/route.ts:8`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟡 **TS6133: 'request' is declared but its value is never read.** — `src/app/api/ai/jobs/[jobId]/route.ts:7`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟡 **TS6133: 'user' is declared but its value is never read.** — `src/app/api/ai/jobs/[jobId]/route.ts:7`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟡 **TS6133: 'request' is declared but its value is never read.** — `src/app/api/catalog/items/route.ts:17`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟡 **TS6133: 'withAuth' is declared but its value is never read.** — `src/app/api/categories/route.ts:4`
  - Eliminar import/variable no usada o prefijar con _ si es param
- 🟡 **TS6133: 'request' is declared but its value is never read.** — `src/app/api/categories/route.ts:9`
  - Eliminar import/variable no usada o prefijar con _ si es param
- ... y 115 hallazgos más en este scanner.

### domain-integrity

- 🟡 **Posible lógica de negocio en Infrastructure: Cálculo financiero** — `src\infrastructure\persistence\supabase\repositories\SupabasePlatformConfigRepository.ts:3`
  - Mover esta lógica al Domain o Application layer
- 🟡 **Posible lógica de negocio en Infrastructure: Cálculo financiero** — `src\infrastructure\persistence\supabase\repositories\SupabasePlatformConfigRepository.ts:28`
  - Mover esta lógica al Domain o Application layer
- 🟡 **Posible lógica de negocio en Infrastructure: Cálculo financiero** — `src\infrastructure\persistence\supabase\repositories\SupabasePlatformConfigRepository.ts:29`
  - Mover esta lógica al Domain o Application layer
- 🔵 **console.* en Domain layer** — `src\core\domain\value-objects\Money.ts:46`
  - Usar un Logger port inyectado o eliminar el console.*
- 🔵 **console.* en Domain layer** — `src\core\domain\value-objects\PhoneNumber.ts:14`
  - Usar un Logger port inyectado o eliminar el console.*

### infrastructure

- 🟠 **Posible .from() en Promise sin resolver** — `src\infrastructure\persistence\supabase\SupabaseAIAuditAdapter.ts:121`
  - Asegurar: const supabase = await createClient(); supabase.from(...)
- 🟠 **Posible .from() en Promise sin resolver** — `src\infrastructure\services\SupabaseNotificationAdapter.ts:32`
  - Asegurar: const supabase = await createClient(); supabase.from(...)

### performance

- 🟡 **Componente React pesado con useEffect** — `src\app\admin\services\[id]\page.tsx`
  - Dividir en componentes más pequeños o extraer lógica a custom hooks con useMemo/useCallback
- 🟡 **Componente React pesado con useEffect** — `src\app\client\browse\page.tsx`
  - Dividir en componentes más pequeños o extraer lógica a custom hooks con useMemo/useCallback
- 🟡 **Componente React pesado con useEffect** — `src\app\forgot-password\page.tsx`
  - Dividir en componentes más pequeños o extraer lógica a custom hooks con useMemo/useCallback
- 🟡 **Componente React pesado con useEffect** — `src\app\global-error.tsx`
  - Dividir en componentes más pequeños o extraer lógica a custom hooks con useMemo/useCallback
- 🟡 **Componente React pesado con useEffect** — `src\app\login\page.tsx`
  - Dividir en componentes más pequeños o extraer lógica a custom hooks con useMemo/useCallback
- 🟡 **Componente React pesado con useEffect** — `src\app\quotation\success\page.tsx`
  - Dividir en componentes más pequeños o extraer lógica a custom hooks con useMemo/useCallback
- 🟡 **Componente React pesado con useEffect** — `src\app\wizard\page.tsx`
  - Dividir en componentes más pequeños o extraer lógica a custom hooks con useMemo/useCallback
- 🔵 **Ruta API GET sin estrategia de cache** — `src\app\api\admin\stats\finance\route.ts`
  - Agregar export const revalidate = 60; o similar
- 🔵 **Ruta API GET sin estrategia de cache** — `src\app\api\quotations\[id]\matching\route.ts`
  - Agregar export const revalidate = 60; o similar

## Recommendations

- 🚨 HAY 42 HALLAZGO(S) CRÍTICO(S). Resolver antes de cualquier deploy.
- ## 1. TSC — POR TIPO DE ERROR
- ❌ Scanner 'typescript' falló: 135 errores (135 producción, 0 tests)
- 📉 'typescript' tiene score 33/100. Priorizar mejoras.
- 📉 'performance' tiene score 64/100. Priorizar mejoras.
- 🔧 32 hallazgos son auto-fixeables. Ejecutar: npx tsx scripts/diagnostics/auto-fix.ts