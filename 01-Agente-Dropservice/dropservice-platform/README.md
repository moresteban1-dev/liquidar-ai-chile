# 🚀 Dropservice Platform - NASA-Grade Architecture

> Plataforma de dropservicing con arquitectura hexagonal, DDD y observabilidad completa.

[![CI](https://github.com/your-org/dropservice/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/dropservice/actions)
[![Coverage](https://codecov.io/gh/your-org/dropservice/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/dropservice)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Testing](#testing)
- [Deployment](#deployment)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Convenciones](#convenciones)
- [Contributing](#contributing)

---

## ✨ Características

### 🎯 Modelo de Negocio
- **Triple-State Pricing:** Costo proveedor, comisión admin, precio cliente.
- **Order FSM:** Máquina de estados finita para órdenes.
- **Event-Driven:** Comunicación mediante Domain Events.

### 🏗️ Arquitectura
- **Hexagonal Architecture:** Desacoplamiento total del dominio.
- **Domain-Driven Design:** Aggregates, Value Objects, Domain Events.
- **Result Type Pattern:** Error handling funcional.
- **Repository Pattern:** Abstracción de persistencia.

---

## 🏛️ Arquitectura

```text
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER │
│ Next.js 14 App Router + React Server Components │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER │
│ Use Cases (Commands/Queries) + Handlers │
│ Ports (Interfaces): IOrderRepository, IEmailService │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ DOMAIN LAYER │
│ Aggregates: Order, Quotation, Provider │
│ Value Objects: Money, Email, Address │
│ Business Rules & Invariants │
└─────────────────────────────────────────────────────────────┘
↑
┌─────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE LAYER │
│ Adapters: Supabase, SendGrid, Stripe │
│ Repositories, Mappers, Services │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local

# 3. Iniciar desarrollo
npm run dev
```

---

## 🧪 Testing

```bash
npm run test             # Ejecutar tests
npm run test:coverage    # Tests con coverage
```

**NASA-Grade Standard**: Cobertura > 80% en lógica crítica.

---

## 🤝 Contributing

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para detalles sobre el workflow de desarrollo.

---

## 📄 Licencia

MIT © Dropservice Platform
