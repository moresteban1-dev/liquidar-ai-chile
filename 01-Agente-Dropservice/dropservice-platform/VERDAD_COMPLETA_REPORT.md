# Informe de Verdad Completa: Mapa Forense de Paths

Este informe detalla la estructura real y los conflictos identificados tras la auditoría profunda del codebase.

## 🏛️ Ubicación de Agregados (Domain)

| Entidad | Path Físico | Alias Sugerido |
| :--- | :--- | :--- |
| **Quotation** | `src/core/domain/aggregates/quotation/Quotation.ts` | `@domain/aggregates/quotation/Quotation` |
| **Order** | `src/core/domain/aggregates/order/Order.ts` | `@domain/aggregates/order/Order` |
| **Money** | `src/core/domain/value-objects/Money.ts` | `@domain/value-objects/Money` |

## 🔌 Ubicación de Puertos (Application)

| Puerto | Path Físico | Alias Canónico |
| :--- | :--- | :--- |
| **IQuotationRepository** | `src/core/application/ports/IQuotationRepository.ts` | `@app/ports/IQuotationRepository` |
| **IOrderRepository** | `src/core/application/ports/IOrderRepository.ts` | `@app/ports/IOrderRepository` |
| **NotificationPort** | `src/core/application/ports/NotificationPort.ts` | `@app/ports/NotificationPort` |

## ⚠️ Alerta de Conflictos (Shadowing)

Se ha detectado que los componentes de la interfaz de usuario **redefinen** los tipos del dominio, lo que causa colisiones en los imports:

1. QuotationsTable.tsx: `export interface Quotation` (Línea 26)
    - *Riesgo*: Si intentas importar el agregado de dominio en este componente, colisionará.
2. OrdersTable.tsx: `export interface Order` (Línea 21)
    - *Riesgo*: Similar al anterior, el tipo de UI no incluye los métodos de negocio del agregado.

## 📦 Mapa de Aliases (tsconfig.json)

- `@/*` -> `src/*`
- `@core/*` -> `src/core/*`
- `@shared/*` -> `src/core/shared/*`
- `@app/*` -> `src/core/application/*`
- `@domain/*` -> `src/core/domain/*`

## 🛠️ Recomendación de Refactorización

Para resolver los errores TS2307 y las colisiones:

1. Renombrar los tipos de UI a `QuotationDTO` u `OrderViewModel`.
2. Centralizar los imports usando los alias `@app/ports/` y `@domain/`.
