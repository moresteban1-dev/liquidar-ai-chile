# CATÁLOGO + COTIZADOR INTELIGENTE + DASHBOARDS OPTIMIZADOS

Plataforma Dropservice de Producción de Eventos
Versión: 1.0

## Visión General y Contexto

Construir un "cerebro" centralizado que permita:

- Al Administrador: Gestionar un catálogo maestro de servicios/equipamiento, controlar márgenes, y orquestar todo el flujo de cotizaciones.
- Al Cliente: Cotizar eventos de forma rápida y fluida, recibir 3 opciones automáticas, y tener control total de su evento.
- Al Proveedor: Recibir solicitudes estructuradas, cotizar de forma estandarizada, y gestionar su inventario.

## Arquitectura V2 (Backward Compatible)

- Las tablas V1 (`services`, `categories`) siguen funcionando.
- Las nuevas tablas V2 (`catalog_items`, `catalog_categories`, etc.) coexisten.
- APIs actuales siguen funcionando. Nuevas APIs son aditivas.

## Flujo de Negocio Completo

- **FASE 1: CLIENTE SOLICITA** (Cotizador 5 pasos -> PENDING_ASSIGNMENT)
- **FASE 2: ADMIN ORQUESTA** (Selecciona proveedores -> PENDING_PROVIDER_BID)
- **FASE 3: PROVEEDOR COTIZA** (Llena RFP -> PENDING_ADMIN_APPROVAL)
- **FASE 4: ADMIN CONSOLIDA Y APLICA MARGEN** (Aplica reglas % -> AWAITING_CLIENT_PAYMENT)
- **FASE 5: CLIENTE APRUEBA Y PAGA** (Paga 30% -> APPROVED)

## Modelo de Datos (7 Tablas Principales)

1. `catalog_categories`: Árbol jerárquico 3 niveles
2. `catalog_items`: Biblioteca maestra de servicios/equipos (500+)
3. `event_templates`: Plantillas predefinidas de eventos (20-30)
4. `event_template_items`: Ítems incluidos por plantilla (200+)
5. `provider_catalog_items`: Inventario de cada proveedor (1000+)
6. `platform_config`: Configuración centralizada (10-15)
7. `catalog_price_history`: Auditoría de cambios de precio

## Servicios de Aplicación Core

1. CatalogService
2. CatalogAdminService
3. EventTemplateService
4. PlatformConfigService
5. PricingCalculatorService
6. VariantGeneratorService
7. QuotationOrchestrator
8. RFPService

*(Nota: Este documento es un resumen extraído del prompt original del usuario para referencia rápida durante el desarrollo de la Fase V2)*
