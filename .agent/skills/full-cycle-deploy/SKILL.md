---
name: full-cycle-deploy
description: Ejecuta un análisis profundo del código, corrige errores exhaustivamente, actualiza el repositorio remoto y despliega en Vercel con verificación visual.
version: 1.0
---

# Full Cycle Deploy Skill

Esta habilidad guía al agente a través de un proceso riguroso de aseguramiento de calidad y despliegue.

## Fase 1: Análisis Arquitectónico y Estático

1. **Escaneo de Estructura**: Verifica que no existan violaciones de "Dependencia Inversa" (ej. Dominio importando Infraestructura), protegiendo la Arquitectura Hexagonal.
2. **Detección de Deuda Técnica**: Identifica código muerto, tipos "any" en TypeScript, o falta de manejo de errores.
3. **Plan de Implementación**: Genera un **Artifact** (Implementation Plan) listando todos los errores encontrados y la estrategia de corrección propuesta antes de tocar una sola línea de código.

## Fase 2: Corrección Exhaustiva (Auto-Healing)

1. **Ejecución**: Una vez aprobado el plan, aplica las correcciones.
2. **Validación Unitaria**: Ejecuta los tests unitarios existentes. Si fallan, entra en un bucle de "Diagnóstico -> Corrección -> Reintento" (máximo 3 intentos).
3. **Verificación Visual**: Utiliza la **Browser Surface** para abrir la aplicación en local (`localhost`), navegar por las rutas críticas y tomar capturas de pantalla para confirmar que la UI no se ha roto.

## Fase 3: Gestión de Versiones (Git)

1. **Staging**: Ejecuta `git add .`
2. **Semantic Commit**: Genera un mensaje de commit siguiendo la convención "Conventional Commits" basado en los cambios realizados (ej. `fix:`, `feat:`, `chore:`).
3. **Push**: Realiza el `git push origin main`. Si hay conflictos, solicita intervención manual.

## Fase 4: Despliegue en Vercel

1. **Deploy**: Ejecuta `vercel --prod` utilizando las credenciales configuradas en el entorno.
2. **Verificación de Producción**: Una vez desplegado, visita la URL de producción con el navegador del agente y verifica que el status code sea 200.
3. **Reporte Final**: Genera un **Artifact** de resumen con:
   - Resumen de errores corregidos.
   - Link al Commit.
   - Link al Despliegue en Vercel.
   - Captura de pantalla de la app en producción.
