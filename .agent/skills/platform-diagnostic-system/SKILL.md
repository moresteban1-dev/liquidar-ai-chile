---
name: platform-diagnostic-system
description: Skill de Diagnóstico Forense Multicapa — Enterprise Grade para Dropservice Platform.
---

# 🏥 Platform Diagnostic System (PDS)

## 🎯 Propósito
Esta skill permite realizar un diagnóstico profundo, multicapa y automatizado de la salud sistémica de la plataforma Dropservice. Su objetivo es detectar erosión arquitectónica, vulnerabilidades de seguridad, degradación de rendimiento e inconsistencias de dominio (DDD) antes de que lleguen a producción.

## 📐 Arquitectura
El PDS utiliza un motor de diagnóstico desacoplado que orquesta una serie de escáneres especializados:

1.  **TypeScript Scanner**: Censo exacto de errores de compilación y tipado.
2.  **Domain Integrity Scanner**: Validación de reglas DDD (Aggregates, VOs, Dependency Rule).
3.  **Infrastructure Scanner**: Verificación de salud de conexiones (Supabase, Redis, BullMQ).
4.  **Security Scanner**: Auditoria contra OWASP (SQLi, XSS, Insecure Logging).
5.  **Performance Scanner**: Detección de N+1 queries y cuellos de botella en React.

## 🛠️ Uso y Comandos

### Ejecución de Diagnóstico Total
Para ejecutar un chequeo completo de la plataforma:
```bash
npx tsx scripts/diagnose.ts
```

### Ejecución Selectiva
Para ejecutar escáneres específicos:
```bash
# Solo seguridad y performance
npx tsx scripts/diagnose.ts --only security performance
```

## 📋 Protocolo de Respuesta
Cada ejecución genera un reporte en `PDS_LAST_DIAGNOSTIC.md` con:
- **Health Score (0-100)**: Puntuación ponderada por criticidad.
- **Grado Forense (AAA - F)**: Calificación Enterprise.
- **Hallazgos Críticos**: Bloqueadores inmediatos.
- **Plan de Acción Sugerido**: Pasos quirúrgicos para el saneamiento.

## 🏛️ Filosofía de Ingeniería
Este sistema se rige por la regla de **Zero Tolerance to Technical Debt**. Si el score es inferior a 90, se recomienda encarecidamente NO proceder con el despliegue hasta subsanar los hallazgos críticos.
