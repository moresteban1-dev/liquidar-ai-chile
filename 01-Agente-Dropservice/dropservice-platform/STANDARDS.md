# Dropservice Platform: NASA-Grade Engineering Standards

## 1. 🏗️ Arquitectura
- **Hexagonal Estricta**: No se permiten dependencias de `infrastructure` en `core`.
- **Domain-Driven Design**: Lógica de negocio encapsulada en `Aggregates` y `Entities`.
- **Result Pattern**: Todas las operaciones que pueden fallar DEBEN retornar `Result<T, E>`.

## 2. 🛡️ TypeScript & Coding Style
- **Zero `any`**: El uso de `any` está prohibido. Usar `unknown` si es necesario.
- **Strict Mode**: Todas las flags de `strict` en `tsconfig.json` deben estar activas.
- **Inmutabilidad**: Los `Value Objects` deben ser inmutables.
- **Validación Defensiva**: Usar `Guard` clauses en constructores para asegurar invariantes.

## 3. 🧪 Testing (Vitest)
- **Unit Tests**: Obligatorios para toda la lógica de dominio en `core`.
- **Coverage**: Cobertura mínima del 80% en `core/domain`.
- **F.I.R.S.T**: Los tests deben ser Fast, Independent, Repeatable, Self-validating y Timely.

## 4. 🚀 Git & Deployment
- **Commits Semánticos**: Seguir el estándar `type: description` (feat, fix, refactor, test, docs).
- **PR size**: Mantener Pull Requests de menos de 400 líneas para revisiones efectivas.
- **CI Enforcement**: El build y los tests deben pasar antes de cualquier merge a `main`.

## 📊 Performance Benchmarks
- **API Response**: < 500ms P95.
- **DB Queries**: < 100ms P95.
- **Lighthouse Score**: > 90 en todas las categorías.
