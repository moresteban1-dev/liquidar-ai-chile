# Hexagonal Architecture (Ports & Adapters)

## 🎯 ¿Qué es Hexagonal Architecture?

También conocida como "Ports & Adapters", es un patrón arquitectónico que:

1. **Aísla la lógica de negocio** de detalles técnicos
2. **Define contratos claros** (Ports) para interacción
3. **Permite intercambiar implementaciones** (Adapters) sin cambiar el core

---

## 🧩 Componentes Principales

```text
     ┌─────────────────────────────────┐
     │                                 │
     │       APPLICATION CORE          │
     │    (Business Logic)             │
     │                                 │
     │  ┌─────────────────────────┐   │
     │  │   Domain Model          │   │
     │  │   (Aggregates, VOs)     │   │
     │  └─────────────────────────┘   │
     │                                 │
     │  ┌─────────────────────────┐   │
     │  │   Use Cases             │   │
     │  │   (Handlers)            │   │
     │  └─────────────────────────┘   │
     │                                 │
     │  ┌─────────────────────────┐   │
     │  │   Ports (Interfaces)    │   │
     │  └─────────────────────────┘   │
     │            ↑         ↑          │
     └────────────┼─────────┼──────────┘
                  │         │
     ┌────────────┼─────────┼──────────┐
     │   Adapters │         │ Adapters │
     │            ↓         ↓          │
     │  ┌──────────┐   ┌──────────┐   │
     │  │ Supabase │   │   HTTP   │   │
     │  │  Repo    │   │   API    │   │
     │  └──────────┘   └──────────┘   │
     └─────────────────────────────────┘
```

---

## 🔌 Ports (Interfaces)

**Definición:** Contratos que define el core para comunicarse con el exterior.

### 1. Primary Ports (Driving)
Definen cómo el exterior **usa** el core (ej: `CreateOrderUseCase`).

### 2. Secondary Ports (Driven)
Definen qué necesita el core del exterior (ej: `IOrderRepository`).

---

## 🔧 Adapters (Implementaciones)

**Definición:** Implementaciones concretas de los Ports. Podrían ser `SupabaseOrderRepository` o `SendGridEmailService`.

---

## 📐 Reglas de Arquitectura

✅ **Permitido:**
- Infrastructure → Core (Implementa Port)
- Application → Domain (Usa Aggregates)
- Presentation → Application (Usa Use Cases)

❌ **Prohibido:**
- Domain → Infrastructure (Importar Supabase en una Entity)
- Domain → Presentation (Importar NextRequest en un Aggregate)
