# Domain-Driven Design (DDD) Fundamentals

## 🎯 ¿Qué es DDD?

Domain-Driven Design es un enfoque de desarrollo de software que se centra en:

1. **Entender profundamente el dominio del negocio**
2. **Crear un modelo rico que refleje ese dominio**
3. **Usar un lenguaje ubicuo (Ubiquitous Language)**

---

## 🧱 Building Blocks del DDD

### 1. Value Objects

**Características:**
- Inmutables
- Se definen por sus atributos, no por identidad
- Pueden ser reemplazados
- Validación en construcción

**Ejemplo: Money**

```typescript
// ❌ Primitive Obsession
let price = 100  // ¿USD? ¿EUR? ¿Puede ser negativo?

// ✅ Value Object
const priceResult = Money.create(100, 'USD')
if (priceResult.isSuccess()) {
  const price = priceResult.getValue()
  // Garantizado: positivo, con moneda, validado
}
```

### 2. Entities
**Características:**
- Tienen identidad única
- Pueden cambiar sus atributos
- Se rastrean a lo largo del tiempo

**Ejemplo: Order**

```typescript
const order1 = Order.create({ ... }, new UniqueEntityID('order-123'))
const order2 = Order.create({ ... }, new UniqueEntityID('order-123'))

order1.equals(order2) // true (misma identidad)
```

### 3. Aggregates
**Características:**
- Cluster de Entities y Value Objects
- Una Entity es la raíz (Aggregate Root)
- Garantizan invariantes de negocio
- Límite de transacciones

---

## 🎨 Ubiquitous Language

Definición: Vocabulario compartido entre negocio y desarrollo. El código debe leerse como las reglas de negocio, no como implementaciones técnicas.

---

## 🏗️ Layered Architecture (DDD)

1. **Presentation Layer**: UI, Controllers (Next.js Routes)
2. **Application Layer**: Use Cases, Handlers (Orquestación)
3. **Domain Layer**: Pure Business Logic (Aggregates, VOs)
4. **Infrastructure Layer**: DB, Email, External APIs
