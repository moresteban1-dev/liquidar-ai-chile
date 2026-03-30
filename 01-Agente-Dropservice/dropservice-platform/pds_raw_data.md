# PDS Raw Data — Diagnóstico Exhaustivo
Generado: 2026-03-28T14:26:48.083Z

## 1. TSC — POR TIPO DE ERROR
- **TS2307**: 25
- **TS18048**: 24
- **TS6133**: 23
- **TS2345**: 18
- **TS2339**: 14
- **TS2322**: 13
- **TS2532**: 12
- **TS7006**: 10
- **TS2538**: 2
- **TS6196**: 2
- **TS2551**: 1
- **TS18046**: 1
- **TS18047**: 1
- **TS2724**: 1
- **TS2305**: 1
- **TS2554**: 1

## 2. TSC — TOP 25 ARCHIVOS
- 14 errors: `scripts/fix-imports-exact.ts`
- 11 errors: `scripts/diagnostics/scanners/security.scanner.ts`
- 10 errors: `scripts/diagnostics/scanners/infrastructure.scanner.ts`
- 5 errors: `scripts/baseline.ts`
- 5 errors: `scripts/diagnose.ts`
- 5 errors: `scripts/verify_e2e_fixes.ts`
- 4 errors: `src/infrastructure/notifications/channels/EmailChannel.ts`
- 3 errors: `scripts/collect_raw_data.ts`
- 3 errors: `scripts/final-ai-audit.ts`
- 3 errors: `scripts/kill-unused-vars.ts`
- 3 errors: `scripts/migrate-logs.ts`
- 3 errors: `src/lib/dashboard/admin-data.service.ts`
- 2 errors: `scripts/diagnostics/reporter.ts`
- 2 errors: `scripts/forensic-scan.ts`
- 2 errors: `scripts/kill-unused-vars-pro.ts`
- 2 errors: `scripts/seed-production.ts`
- 2 errors: `scripts/validate-env.ts`
- 2 errors: `scripts/verify-ai-flow.ts`
- 2 errors: `src/app/client/orders/ClientOrdersClient.tsx`
- 2 errors: `src/app/vendor/orders/VendorOrdersClient.tsx`
- 2 errors: `src/components/admin/users/columns.tsx`
- 2 errors: `src/components/ai/SalesAgentChat.tsx`
- 2 errors: `src/core/application/services/SLAService.ts`
- 2 errors: `src/core/domain/pricing/PricingCalculator.ts`
- 2 errors: `src/infrastructure/cache/semantic-cache.ts`

## 3. TSC — PRIMEROS 60 ERRORES
```text
scripts/baseline.ts(12,89): error TS2551: Property 'catch' does not exist on type 'string'. Did you mean 'match'?
scripts/baseline.ts(12,95): error TS7006: Parameter 'e' implicitly has an 'any' type.
scripts/baseline.ts(13,57): error TS7006: Parameter 'line' implicitly has an 'any' type.
scripts/baseline.ts(16,21): error TS18046: 'e' is of type 'unknown'.
scripts/baseline.ts(16,56): error TS7006: Parameter 'line' implicitly has an 'any' type.
scripts/collect_raw_data.ts(26,22): error TS2538: Type 'undefined' cannot be used as an index type.
scripts/collect_raw_data.ts(26,37): error TS2538: Type 'undefined' cannot be used as an index type.
scripts/collect_raw_data.ts(38,19): error TS2532: Object is possibly 'undefined'.
scripts/diagnose.ts(44,32): error TS2339: Property 'results' does not exist on type 'DiagnosticReport'.
scripts/diagnose.ts(44,45): error TS7006: Parameter 'r' implicitly has an 'any' type.
scripts/diagnose.ts(45,37): error TS2339: Property 'results' does not exist on type 'DiagnosticReport'.
scripts/diagnose.ts(45,53): error TS7006: Parameter 'r' implicitly has an 'any' type.
scripts/diagnose.ts(45,77): error TS7006: Parameter 'f' implicitly has an 'any' type.
scripts/diagnostics/engine.ts(181,9): error TS18048: 'counts.critical' is possibly 'undefined'.
scripts/diagnostics/reporter.ts(3,33): error TS6196: 'ScanResult' is declared but never used.
scripts/diagnostics/reporter.ts(3,45): error TS6196: 'Severity' is declared but never used.
scripts/diagnostics/scanners/infrastructure.scanner.ts(74,11): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/infrastructure.scanner.ts(75,12): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/infrastructure.scanner.ts(91,96): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/infrastructure.scanner.ts(104,11): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/infrastructure.scanner.ts(170,13): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/infrastructure.scanner.ts(170,45): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/infrastructure.scanner.ts(174,34): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
scripts/diagnostics/scanners/infrastructure.scanner.ts(211,38): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
scripts/diagnostics/scanners/infrastructure.scanner.ts(212,12): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/infrastructure.scanner.ts(231,48): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
scripts/diagnostics/scanners/security.scanner.ts(61,12): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/security.scanner.ts(61,38): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/security.scanner.ts(62,11): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/security.scanner.ts(63,11): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/security.scanner.ts(70,83): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/security.scanner.ts(96,15): error TS2532: Object is possibly 'undefined'.
scripts/diagnostics/scanners/security.scanner.ts(185,12): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/security.scanner.ts(186,13): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/security.scanner.ts(187,13): error TS18048: 'line' is possibly 'undefined'.
scripts/diagnostics/scanners/security.scanner.ts(188,48): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
scripts/diagnostics/scanners/security.scanner.ts(195,76): error TS18048: 'line' is possibly 'undefined'.
scripts/error-census-final.ts(27,26): error TS2532: Object is possibly 'undefined'.
scripts/final-ai-audit.ts(18,15): error TS6133: 'catalog' is declared but its value is never read.
scripts/final-ai-audit.ts(19,15): error TS6133: 'pricing' is declared but its value is never read.
scripts/final-ai-audit.ts(20,15): error TS6133: 'sla' is declared but its value is never read.
scripts/fix-imports-exact.ts(80,25): error TS18048: 'line' is possibly 'undefined'.
scripts/fix-imports-exact.ts(84,26): error TS2532: Object is possibly 'undefined'.
scripts/fix-imports-exact.ts(86,15): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
scripts/fix-imports-exact.ts(155,11): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
scripts/fix-imports-exact.ts(156,26): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
scripts/fix-imports-exact.ts(167,11): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
scripts/fix-imports-exact.ts(168,26): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
scripts/fix-imports-exact.ts(261,42): error TS2532: Object is possibly 'undefined'.
scripts/fix-imports-exact.ts(292,45): error TS18048: 'exp' is possibly 'undefined'.
scripts/fix-imports-exact.ts(293,24): error TS18048: 'exp' is possibly 'undefined'.
scripts/fix-imports-exact.ts(293,52): error TS18048: 'exp' is possibly 'undefined'.
scripts/fix-imports-exact.ts(324,43): error TS18048: 'exp' is possibly 'undefined'.
scripts/fix-imports-exact.ts(325,22): error TS18048: 'exp' is possibly 'undefined'.
scripts/fix-imports-exact.ts(325,50): error TS18048: 'exp' is possibly 'undefined'.
scripts/forensic-scan.ts(229,112): error TS2532: Object is possibly 'undefined'.
scripts/forensic-scan.ts(230,108): error TS2532: Object is possibly 'undefined'.
scripts/kill-unused-vars-pro.ts(23,24): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
scripts/kill-unused-vars-pro.ts(24,23): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
scripts/kill-unused-vars.ts(1,1): error TS6133: 'execSync' is declared but its value is never read.
```

## 4. PRODUCCIÓN vs TESTS
- Producción: **149**
- Tests: **0**

## 5. ERRORES POR DIRECTORIO

## 6. TS2339 — PROPIEDADES INEXISTENTES
### Propiedades:
- `withContext`: 5x
- `results`: 2x
- `fatal`: 2x
- `errors`: 1x
- `append`: 1x
- `content`: 1x
- `serviceName`: 1x
- `correlationId`: 1x
### Tipos afectados:
- `StructuredLogger`: 7x
- `DiagnosticReport`: 2x
- `ZodError<unknown>`: 1x
- `UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>`: 1x
- `UIMessage<unknown, UIDataTypes, UITools>`: 1x
- `InferredNeed`: 1x
- `RequestContextProps`: 1x

## 7. TS2307 — MÓDULOS NO ENCONTRADOS
- `@/core/application/ports/services/IEmailProvider`: 4x
- `@/core/application/ports/events/IEventPublisher`: 3x
- `@/core/application/ports/services/INotificationChannel`: 3x
- `@/core/application/ports/services/INotificationService`: 2x
- `@infrastructure/telemetry/logger-types`: 2x
- `@infrastructure/di/use-case-factory`: 2x
- `../src/infrastructure/repositories/SupabaseOrderRepository`: 1x
- `../src/infrastructure/repositories/SupabaseQuotationRepository`: 1x
- `../src/core/use-cases/quotations/ApproveQuotation`: 1x
- `../src/core/types/branded`: 1x
- `@core/application/ports/CatalogRepository`: 1x
- `@core/application/ports/events/IEventPublisher`: 1x
- `@app/ports/CatalogRepository`: 1x
- `../../application/ports/CatalogRepository`: 1x
- `@/core/application/ports/repositories/IOrderRepository`: 1x

## 8. SEGURIDAD — RUTAS SIN AUTH
- ❌ `src\app\api\ai\jobs\[jobId]\route.ts` [GET]
- ❌ `src\app\api\ai\negotiation-chat\route.ts` [POST]
- ❌ `src\app\api\ai\sales\route.ts` [POST]
- ❌ `src\app\api\auth\register\route.ts` [POST]
- ❌ `src\app\api\categories\route.ts` [GET, POST]
- ❌ `src\app\api\categories\[id]\route.ts` [PUT, DELETE]
- ❌ `src\app\api\client\notifications\route.ts` [GET]
- ❌ `src\app\api\client\quotations\route.ts` [GET]
- ❌ `src\app\api\client\quotations\[id]\route.ts` [GET]
- ❌ `src\app\api\client\stats\route.ts` [GET]
- ❌ `src\app\api\config\route.ts` [GET, PATCH]
- ❌ `src\app\api\cron\expire-payments\route.ts` [GET]
- ❌ `src\app\api\cron\process-events\route.ts` [GET]
- ❌ `src\app\api\health\route.ts` [GET]
- ❌ `src\app\api\orders\route.ts` [POST, GET]
- ❌ `src\app\api\orders\[id]\route.ts` [DELETE]
- ❌ `src\app\api\orders\[id]\transition\route.ts` [GET, POST]
- ❌ `src\app\api\payments\gateways\route.ts` [GET]
- ❌ `src\app\api\payments\webhook\flow\route.ts` [POST]
- ❌ `src\app\api\payments\webhook\khipu\route.ts` [POST]
- ❌ `src\app\api\payments\webhook\webpay\route.ts` [POST, GET]
- ❌ `src\app\api\providers\route.ts` [GET]
- ❌ `src\app\api\quotations\route.ts` [POST]
- ❌ `src\app\api\quotations\[id]\approve\route.ts` [POST]
- ❌ `src\app\api\quotations\[id]\bid\route.ts` [POST]
- ❌ `src\app\api\quotations\[id]\bids\route.ts` [GET, POST]
- ❌ `src\app\api\quotations\[id]\client-items\route.ts` [GET]
- ❌ `src\app\api\quotations\[id]\commission\route.ts` [POST]
- ❌ `src\app\api\quotations\[id]\provider-items\route.ts` [GET]
- ❌ `src\app\api\quotations\[id]\provider-quote\route.ts` [POST]
- ❌ `src\app\api\quotations\[id]\reject\route.ts` [POST]
- ❌ `src\app\api\quotations\[id]\route.ts` [GET, PATCH]
- ❌ `src\app\api\quotations\[id]\submit\route.ts` [POST]
- ❌ `src\app\api\quotations\[id]\transition\route.ts` [POST, PUT]
- ❌ `src\app\api\services\route.ts` [GET]
- ❌ `src\app\api\services\[id]\route.ts` [GET, PUT, DELETE]
- ❌ `src\app\api\stats\route.ts` [GET]
- ❌ `src\app\api\upload\route.ts` [POST, DELETE]
- ❌ `src\app\api\vendor\quotations\[id]\route.ts` [GET]
- ❌ `src\app\api\vendor\stats\route.ts` [GET]
- ❌ `src\app\api\webhooks\payments\callback\route.ts` [GET]
- ❌ `src\app\api\webhooks\webpay\route.ts` [POST]

**Total sin auth: 42/71**

## 9. INFRAESTRUCTURA
### Throws:
- `src\infrastructure\ai\agents\MarketingGeniusAgent.ts:60`: `throw new Error(`Marketing generation failed: ${error instanceof Error ? error.m`
- `src\infrastructure\ai\agents\PricingOracleAgent.ts:67`: `throw new Error(`Pricing prediction failed: ${error instanceof Error ? error.mes`
- `src\infrastructure\ai\agents\QASentinelAgent.ts:65`: `throw new Error(`QA Analysis failed: ${error instanceof Error ? error.message : `
- `src\infrastructure\ai\agents\SLAGuardianAgent.ts:66`: `throw new Error(`SLA check failed: ${error instanceof Error ? error.message : St`
- `src\infrastructure\cache\CacheWarmer.ts:45`: `throw new Error(statsResult.error);`
- `src\infrastructure\cache\CacheWarmer.ts:75`: `throw new Error(recentOrdersResult.error);`
- `src\infrastructure\notifications\email\ResendEmailProvider.ts:57`: `throw new Error(`Resend response error: ${response.status}`);`
- `src\infrastructure\notifications\email\TemplateEngine.ts:43`: `throw new Error(`Template not found: ${templateId}`);`
- `src\infrastructure\notifications\EmailService.ts:56`: `throw new Error(`Resend error: ${JSON.stringify(error)}`)`
- `src\infrastructure\notifications\webhook\WebhookDispatcher.ts:56`: `if (!response.ok) throw new Error(`Webhook response error: ${response.status}`);`
- `src\infrastructure\notifications\WebhookService.ts:44`: `throw new Error(`Webhook status ${response.status}: ${errorText}`)`
- `src\infrastructure\resilience\ChaosMonkey.ts:35`: `throw new Error("ChaosMonkey Injected Failure");`
- `src\infrastructure\resilience\CircuitBreaker.ts:37`: `throw new Error(`Circuit Breaker [${this.options.name}] is OPEN. Last error: ${t`

### Promesas no awaited:
- `src\infrastructure\ai\services\ResilientGenkitService.ts:141`: `return fail(AppError.from(error));`
- `src\infrastructure\events\EventProcessor.ts:27`: `.from('domain_events')`
- `src\infrastructure\events\OutboxProcessor.ts:27`: `.from('event_outbox')`
- `src\infrastructure\events\OutboxProcessor.ts:49`: `.from('event_outbox')`
- `src\infrastructure\events\OutboxProcessor.ts:67`: `.from('event_outbox')`
- `src\infrastructure\events\OutboxProcessor.ts:80`: `.from('event_outbox')`
- `src\infrastructure\events\SupabaseEventPublisher.ts:35`: `.from('event_outbox')`
- `src\infrastructure\http\middleware\ABTestingMiddleware.ts:128`: `Buffer.from(payloadPart, 'base64').toString()`
- `src\infrastructure\http\middleware\RBACMiddleware.ts:60`: `.from('users')`
- `src\infrastructure\http\server-data\serverFetch.ts:81`: `.from('orders')`
- `src\infrastructure\http\server-data\serverFetch.ts:193`: `.from('orders')`
- `src\infrastructure\http\server-data\serverFetch.ts:316`: `.from('quotations')`
- `src\infrastructure\http\server-data\serverFetch.ts:357`: `.from('quotations')`
- `src\infrastructure\http\server-data\serverFetch.ts:403`: `.from('provider_profiles')`
- `src\infrastructure\http\server-data\serverFetch.ts:415`: `.from('provider_inventory')`
- `src\infrastructure\http\server-data\serverFetch.ts:430`: `.from('provider_inventory')`
- `src\infrastructure\http\server-data\serverFetch.ts:450`: `.from('catalog_items')`
- `src\infrastructure\http\server-data\serverFetch.ts:490`: `.from('quotations')`
- `src\infrastructure\http\server-data\serverFetch.ts:512`: `.from('quotation_history')`
- `src\infrastructure\http\server-data\serverFetch.ts:537`: `.from('quotation_provider_items')`

## 10. PERFORMANCE
### use client innecesarios:
- ⚠️ `src\app\admin\components\analytics-charts.tsx`
- ⚠️ `src\app\admin\components\v2\revenue-chart-client.tsx`
- ⚠️ `src\app\admin\DashboardClientPanels.tsx`
- ⚠️ `src\app\client\components\v2\event-timeline.tsx`
- ⚠️ `src\app\client\quotations\ClientQuotationsClient.tsx`
- ⚠️ `src\app\client\quotations\create\page.tsx`
- ⚠️ `src\app\client\quotations\request\page.tsx`
- ⚠️ `src\app\client\quotations\success\page.tsx`
- ⚠️ `src\app\unauthorized\page.tsx`
- ⚠️ `src\app\vendor\components\vendor-performance-panel.tsx`
- ⚠️ `src\app\vendor\inventory\components\InventoryDashboard.tsx`
- ⚠️ `src\app\vendor\quotations\[id]\VendorQuotationDetailClient.tsx`
- ⚠️ `src\components\admin\FinanceGraphs.tsx`
- ⚠️ `src\components\admin\leads\LeadsTable.tsx`
- ⚠️ `src\components\dashboard\stat-card.tsx`
- ⚠️ `src\components\features\analysis\bias-results-view.tsx`
- ⚠️ `src\components\landing\ContactSection.tsx`
- ⚠️ `src\components\landing\HeroSection.tsx`
- ⚠️ `src\components\landing\ProcessSteps.tsx`
- ⚠️ `src\components\landing\TestimonialsSection.tsx`
- ⚠️ `src\components\layout\AppSidebar.tsx`
- ⚠️ `src\components\theme-provider.tsx`
- ⚠️ `src\components\ui\avatar.tsx`
- ⚠️ `src\components\ui\checkbox.tsx`
- ⚠️ `src\components\ui\command.tsx`
- ⚠️ `src\components\ui\dialog.tsx`
- ⚠️ `src\components\ui\dropdown-menu.tsx`
- ⚠️ `src\components\ui\form.tsx`
- ⚠️ `src\components\ui\label.tsx`
- ⚠️ `src\components\ui\minimal-area-chart.tsx`
- ⚠️ `src\components\ui\popover.tsx`
- ⚠️ `src\components\ui\progress.tsx`
- ⚠️ `src\components\ui\scroll-area.tsx`
- ⚠️ `src\components\ui\select.tsx`
- ⚠️ `src\components\ui\separator.tsx`
- ⚠️ `src\components\ui\sheet.tsx`
- ⚠️ `src\components\ui\sparkline.tsx`
- ⚠️ `src\components\ui\switch.tsx`
- ⚠️ `src\components\ui\table.tsx`
- ⚠️ `src\components\ui\tabs.tsx`

## 11. AS ANY EN DOMAIN/APPLICATION
- `src\core\application\handlers\AdminDashboardHandler.ts:19`: `if (statsResult.isFailure()) return statsResult as any`
- `src\core\application\handlers\ApproveQuotationHandler.ts:50`: `const transportEvents = events.map(e => e.toJSON() as any);`
- `src\core\application\handlers\AssignProviderToOrderHandler.ts:18`: `if (orderResult.isFailure()) return orderResult as any`
- `src\core\application\handlers\AssignProviderToOrderHandler.ts:23`: `if (assignResult.isFailure()) return assignResult as any`
- `src\core\application\handlers\AssignProviderToOrderHandler.ts:26`: `if (saveResult.isFailure()) return saveResult as any`
- `src\core\application\handlers\AttachQuotationToOrderHandler.ts:19`: `if (orderResult.isFailure()) return orderResult as any`
- `src\core\application\handlers\AttachQuotationToOrderHandler.ts:22`: `if (quotationResult.isFailure()) return quotationResult as any`
- `src\core\application\handlers\AttachQuotationToOrderHandler.ts:31`: `if (saveResult.isFailure()) return saveResult as any`
- `src\core\application\handlers\CreateOrderHandler.ts:43`: `if (saveResult.isFailure()) return saveResult as any`
- `src\core\application\handlers\DeleteOrderHandler.ts:18`: `if (orderResult.isFailure()) return orderResult as any`
- `src\core\application\handlers\DeleteOrderHandler.ts:25`: `if (saveResult.isFailure()) return saveResult as any`
- `src\core\application\handlers\GetOrderByIdHandler.ts:17`: `if (orderResult.isFailure()) return orderResult as any`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:54`: `sortOrder: pagination.sortOrder as any,`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:59`: `if (queryResult.isFailure()) return queryResult as any`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:68`: `eventDate: (order as any).eventDate.toISOString(), // Temporally cast domain pro`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:69`: `eventType: (order.props as any).eventType,`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:70`: `estimatedGuests: (order.props as any).estimatedGuests,`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:71`: `deliveryAddress: (order as any).deliveryAddress,`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:72`: `isActive: (order as any).isActive,`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:73`: `isPaid: (order as any).isPaid,`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:74`: `daysUntilEvent: (order as any).daysUntilEvent,`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:76`: `pricing: (order as any).pricing ? {`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:77`: `finalPrice: (order as any).pricing.finalPrice.amount,`
- `src\core\application\handlers\ListOrdersByClientHandler.ts:78`: `currency: (order as any).pricing.finalPrice.currency`
- `src\core\application\handlers\ListOrdersByProviderHandler.ts:51`: `if (queryResult.isFailure()) return queryResult as any`
- `src\core\application\handlers\ListQuotationsByOrderHandler.ts:17`: `if (quotationsResult.isFailure()) return quotationsResult as any`
- `src\core\application\handlers\QuotationEventHandlers.ts:18`: `event_date: (ev as any).eventDate, // Type casting while normalizing event props`
- `src\core\application\handlers\quotations\ApplyMarkup.ts:44`: `if (saveRes.isFailure()) return fail(AppError.from(saveRes.getError() as any));`
- `src\core\application\handlers\quotations\ApplyMarkup.ts:49`: `previousStatus: previousStatus as any,`
- `src\core\application\handlers\quotations\ApplyMarkup.ts:50`: `newStatus: quotation.status as any,`
- `src\core\application\handlers\quotations\AssignProvider.ts:51`: `previousStatus: previousStatus as any,`
- `src\core\application\handlers\quotations\AssignProvider.ts:52`: `newStatus: quotation.status as any,`
- `src\core\application\handlers\quotations\AutoMatchProviderItems.ts:47`: `description: (item as any).description || null,`
- `src\core\application\handlers\quotations\AutoMatchProviderItems.ts:48`: `category: (item as any).categoryName || null,`
- `src\core\application\handlers\quotations\AutoMatchProviderItems.ts:49`: `price: (item as any).priceReferenceMin || null`
- `src\core\application\handlers\quotations\AutoMatchProviderItems.ts:60`: `simplifiedCatalog as any`
- `src\core\application\handlers\quotations\OptimizeQuotation.ts:45`: `if (saveRes.isFailure()) return fail(AppError.from(saveRes.getError() as any));`
- `src\core\application\handlers\RejectQuotationHandler.ts:48`: `const transportEvents = events.map(e => e.toJSON() as any);`
- `src\core\application\handlers\SendQuotationToClientHandler.ts:37`: `const transportEvents = events.map(e => e.toJSON() as any);`
- `src\core\application\handlers\SubmitQuotationHandler.ts:17`: `if (quotationResult.isFailure()) return quotationResult as any`
- `src\core\application\handlers\SubmitQuotationHandler.ts:22`: `if (submitResult.isFailure()) return submitResult as any`
- `src\core\application\handlers\SubmitQuotationHandler.ts:25`: `if (saveResult.isFailure()) return saveResult as any`
- `src\core\application\handlers\TransitionOrderStateHandler.ts:53`: `const transportEvents = events.map(e => e.toJSON() as any);`
- `src\core\application\services\CatalogService.ts:92`: `if (validation.isFailure()) return validation as any;`
- `src\core\application\services\CatalogService.ts:125`: `if (data.type && data.type !== (existing as any).type) {`
- `src\core\application\services\CatalogService.ts:185`: `if (itemResult.isFailure()) return itemResult as any;`
- `src\core\application\services\InferenceToRFQService.ts:121`: `const bestMatches = matches.isSuccess() ? matches.getValue() as any[] : [];`
- `src\core\application\services\notification.service.ts:61`: `const template = (NotificationService.STATUS_TEMPLATES as any)[newStatus];`
- `src\core\application\services\PdfService.ts:70`: `(doc as any).text('Información del Cliente', labelX, labelY);`
- `src\core\application\services\PdfService.ts:239`: `(doc as any).text('Detalles del Requerimiento', margin + 5, currentY + 8);`
- `src\core\application\services\SLAService.ts:59`: `if (activeOrdersRes.isFailure()) return activeOrdersRes as any;`

---
**TOTAL TSC ERRORS: 149**
**Generado: 2026-03-28T14:26:52.945Z**