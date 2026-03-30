# Contributing Guidelines

## Workflow de Desarrollo

Para mantener la calidad "NASA-Grade" de la plataforma, seguimos un workflow riguroso de ingeniería:

1. **Crear rama** desde `main` siguiendo la convención `feature/mi-mejor-feature` o `fix/descripcion-bug`.
2. **Implementar bajo DDD**: Asegúrate de que la lógica de negocio resida en `core/` y sea agnóstica a la infraestructura.
3. **Tests Primero (TDD)**: No se acepta código sin suite de pruebas.
4. **Verificación Local**: Antes de subir cambios, los siguientes comandos deben pasar:

```bash
npm run test        # Pruebas unitarias/integración
npm run type-check  # Validación de tipos estricta (tsc)
npm run lint       # Estándar de código (ESLint)
```

5. **Commit siguiendo Conventional Commits**:
   - `feat:` nueva funcionalidad.
   - `fix:` corrección de bug.
   - `refactor:` mejora de estructura sin cambiar lógica.
   - `test:` agregado o modificación de tests.
   - `docs:` documentación.
   - `chore:` tareas de mantenimiento (deps, config).

---

## Definition of Done (DoD)

Un ticket o funcionalidad se considera "Hecho" únicamente si cumple con:

✅ **Código Implementado**: Sigue clean architecture y SOLID.
✅ **Tests Passing**: Cobertura > 80% en la nueva lógica.
✅ **Zero `any` Types**: El uso de `any` está prohibido salvo casos de interop excepcionales.
✅ **Documentación Actualizada**: Los cambios de diseño se reflejan en `ARCHITECTURE.md`.
✅ **CI Green**: Los checks automatizados pasan sin errores.
✅ **Code Review Aprobado**: Al menos 2 aprobaciones de ingenieros senior.

---

## Estándares de Código

- **Patrón Result**: Nunca uses `throw` para errores esperados. Usa el objeto `Result` del shared kernel.
- **Inmutabilidad**: Los Value Objects deben ser inmutables.
- **Pureza**: El dominio no debe importar nada de `node_modules` que no sea estrictamente necesario para la lógica de negocio (ej: utilidades matemáticas).
