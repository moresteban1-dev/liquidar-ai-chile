# Runbook V2: Observability, Reliability & Optimization

Este documento describe cómo operar y mantener los nuevos sistemas de infraestructura introducidos en el Sprint 3.

## 1. Deep Optimization Engine (DOS)

El motor de optimización realiza escaneos proactivos para identificar deuda técnica.

- **Endpoint de Escaneo**: `POST /api/admin/optimization/scan`
- **Frecuencia**: Ejecución automática semanal (Cron) o manual vía API.
- **Interpretación de Resultados**:
    - **Score > 90**: Excelente. Mantener el ritmo de desarrollo.
    - **Score 70-80**: Advertencia. Priorizar tareas de "Refactor" en el próximo sprint.
    - **Score < 70**: Crítico. Detener nuevas funcionalidades y aplicar optimizaciones.

## 2. Gestión de Eventos (Outbox Pattern)

Para asegurar que ninguna notificación se pierda, usamos una tabla de despacho diferido.

- **Monitoreo**: Consultar tabla `event_outbox`.
    - `status = 'pending'`: Pendiente de procesar.
    - `status = 'failed'`: Agotó los reintentos (5). Requiere intervención manual.
- **Procesador**: Se ejecuta cada minuto vía cron `/api/cron/process-outbox`.

## 3. Telemetría y Alertas

- **Logs**: Buscar `trace_id` en los logs para correlacionar una petición API con sus efectos secundarios (emails, webhooks).
- **Métricas**: Disponibles en Grafana/Otel-Collector.
- **Alertas**: Definidas en `AlertEngine.ts`. Notificaciones vía Slack/Email configuradas.

## 4. Solución de Problemas Comunes

- **Email no llega**: 
    1. Revisar estado en `event_outbox`.
    2. Verificar logs filtrando por `component: EmailService`.
    3. Comprobar cuotas en el dashboard de Resend.
- **Webhook de N8N falla**:
    1. El sistema reintentará 2 veces automáticamente con backoff.
    2. Revisar logs filtrando por `component: WebhookService`.
    3. Verificar si el secreto de N8N ha rotado.
