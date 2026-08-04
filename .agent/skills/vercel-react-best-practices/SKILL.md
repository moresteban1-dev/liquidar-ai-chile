---
name: vercel-react-best-practices
description: Apply operational guide and best practices for React & Vercel architecture, performance, render optimization, and maintainability.
---

# Vercel React Best Practices Skill

## 1) Propósito

Aplicar una guía operativa para mejorar proyectos React en arquitectura, rendimiento, legibilidad y mantenibilidad, con enfoque práctico para implementación asistida por IA.

## 2) Inputs requeridos

- Objetivo del proyecto React (MVP, producto en producción, refactor, etc.)
- Stack actual (React puro, Next.js, Vite, etc.)
- Restricciones (tiempo, equipo, deuda técnica)
- Resultado esperado (checklist, plan de refactor, PR, auditoría)

## 3) Workflow operativo

1. Auditar estado actual del proyecto (estructura, rendering, data fetching, DX).
2. Priorizar mejoras por impacto:
   - performance percibida
   - complejidad accidental
   - consistencia del código
3. Definir cambios por fases (rápidos, intermedios, estructurales).
4. Implementar mejoras con validación por componente/módulo.
5. Documentar convenciones para evitar regresiones.

## 4) Prompt base

```txt
Actúa como Staff Frontend Engineer experto en React y Vercel best practices.
Objetivo: mejorar este proyecto React en performance, mantenibilidad y claridad.
Contexto: {{stack_actual}}, {{arquitectura_actual}}, {{problemas_detectados}}.
Restricciones: {{restricciones}}.
Salida esperada:
1) auditoría breve,
2) plan priorizado (quick wins / medio plazo / alto impacto),
3) cambios de código concretos,
4) checklist de validación.
```

## 5) Áreas de buenas prácticas a revisar

- Estructura de componentes y separación de responsabilidades.
- Evitar re-renders innecesarios.
- Manejo correcto de estado local/global.
- Data fetching y caching con estrategia clara.
- Accesibilidad base en componentes UI.
- Manejo de errores y estados de carga.
- Convenciones de naming y organización de carpetas.
- Observabilidad mínima (logs/errores/perf).

## 6) Checklist de calidad

- [ ] Componentes con propósito claro y bajo acoplamiento.
- [ ] Props y estado minimizados.
- [ ] Efectos (`useEffect`) bien acotados.
- [ ] Renderizado optimizado en rutas críticas.
- [ ] Estados de loading/error/empty definidos.
- [ ] Convenciones documentadas en la wiki del proyecto.

## 7) Riesgos y mitigaciones

- Riesgo: optimizar prematuramente sin diagnóstico.
  - Mitigación: medir primero (profiling básico y rutas críticas).
- Riesgo: refactor masivo con regresiones.
  - Mitigación: cambios incrementales por módulo + validación por pasos.

## 8) Métricas de efectividad

- Reducción de incidencias de UI.
- Menor tiempo para implementar nuevas features.
- Menor retrabajo en revisiones de código.
- Mejora en métricas de performance de vistas clave.

## 9) Casos de uso

- Auditoría técnica rápida de proyecto React heredado.
- Plan de refactor antes de escalar el producto.
- Definición de estándar de frontend para equipo pequeño.

## 10) Fuente relacionada

- [[../fuentes/vercel-react-best-practices]]
