# Arquitectura Dropservice Platform

## Visión General

Esta plataforma sigue una **Arquitectura Hexagonal** (Ports & Adapters) combinada con **Domain-Driven Design (DDD)**. El objetivo es aislar la lógica de negocio pura de las dependencias externas (bases de datos, APIs de terceros), facilitando el testing y la evolución del sistema.

## Estructura de Carpetas

La raíz del proyecto se organiza bajo `src/`, con dos pilares fundamentales:

```text
src/
├── core/ # 🎯 DOMAIN LAYER (Capa de Dominio)
│ ├── domain/ # Lógica de negocio pura (Invariantes)
│ │ ├── aggregates/ # Order, Quotation (Garantizan consistencia)
│ │ ├── entities/ # Entidades con identidad (QuotationId)
│ │ ├── value-objects/ # Money, Email, Phone (Inmutables, validación en construcción)
│ │ ├── events/ # Domain Events (Cosas que pasaron)
│ │ └── errors/ # Domain Errors (Errores de negocio tipados)
│ │
│ ├── application/ # 🔧 USE CASES (Casos de Uso)
│ │ ├── commands/ # Operaciones de escritura (Intención)
│ │ ├── queries/ # Operaciones de lectura (Datos)
│ │ ├── handlers/ # Lógica de orquestación de Casos de Uso
│ │ └── ports/ # 🔌 INTERFACES (Contratos)
│ │ ├── repositories/ # IOrderRepository, IQuotationRepository
│ │ ├── services/ # IEmailService, IPaymentGateway
│ │ └── events/ # IEventPublisher
│ │
│ └── shared/ # 📦 SHARED KERNEL
│ ├── Result.ts # Patrón Result (Anti-Exception)
│ ├── Guard.ts # Utilidades de validación defensiva
│ ├── Entity.ts # Clase base para Entidades
│ └── AggregateRoot.ts # Clase base para Agregados
│
└── infrastructure/ # 🏗️ ADAPTERS (Capa de Infraestructura)
├── persistence/ # Bases de Datos
│ └── supabase/ # Adaptador Supabase
│ ├── repositories/ # Implementaciones de Repositorios (SQL)
│ └── mappers/ # Traducción entre Dominio ↔ Persistencia
│
├── telemetry/ # Observabilidad
│ ├── OpenTelemetryTracer.ts # Trazas distribuidas
│ └── StructuredLogger.ts # Logs en formato JSON (Pino)
│
└── di/ # Inyección de Dependencias
└── ApplicationRegistry.ts # Contenedor de composición raíz
```

## Principios Fundamentales

### 1. La Regla de Dependencia (Dependency Rule)
La dirección de las dependencias siempre va hacia adentro.
- `core/` NO depende de `infrastructure/`.
- `infrastructure/` SÍ depende de `core/` (implementa sus interfaces).
Nothing in `domain` should know about React, Next.js, or Supabase.

### 2. El Patrón Result
No usamos `throw new Error()` para flujo de control de negocio. Todas las operaciones en el dominio retornan un objeto `Result`.

```typescript
// ✅ BIEN
const moneyResult = Money.create(100, 'USD');
if (moneyResult.isFailure()) {
  return fail(moneyResult.getError());
}
const money = moneyResult.getValue();
```

### 3. Value Objects
Los tipos primitivos (number, string) son peligrosos. Usamos Value Objects inmutables que validan sus invariantes en el constructor. Si tienes un `Money`, garantizas que no es negativo y que tiene un formato correcto.

### 4. Aggregates
Son los guardianes de las reglas de negocio. Todas las modificaciones a los datos deben pasar por un Agregado, el cual emite `Domain Events` tras realizar cambios válidos.

---

## Estrategia de Testing

- **Unit Tests**: Prueban la lógica de negocio pura (Value Objects, Entities, Handlers). Mockeamos todos los puertos.
- **Integration Tests**: Prueban que nuestros adaptadores (Supabase) funcionan correctamente contra una base de datos real o Dockerizada.
- **E2E Tests**: Prueban que el flujo completo (Next.js Actions -> UI) funciona.

**NASA-Grade Standard**: Cobertura > 80% en lógica crítica.
