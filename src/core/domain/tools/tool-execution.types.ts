/**
 * @module tool-execution.types
 * @description Tipos de dominio compartidos para todas las herramientas de IA.
 * Define los contratos fundamentales de ejecución, proveedores, límites de uso
 * y registros de exportación.
 */

// ─── Tipos de Unión (Proveedores y Estados) ─────────────────────────────────

/** Proveedores de IA soportados por la plataforma */
export type AIProviderType = 'gemini' | 'perplexity' | 'claude' | 'openai' | 'groq';

/** Estado del ciclo de vida de una ejecución de herramienta */
export type ToolRunStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/** Tipos de herramientas disponibles en el módulo */
export type ToolType =
  | 'competitive-analysis'
  | 'prompt-engineering'
  | 'seo-architect'
  | 'database-creator';

/** Nivel de plan del usuario para cálculo de límites */
export type PlanTier = 'free' | 'basic' | 'professional' | 'enterprise';

/** Formatos de exportación soportados */
export type ExportFormat = 'pdf' | 'csv' | 'excel';

// ─── Interfaces de Dominio ──────────────────────────────────────────────────

/**
 * Registro de ejecución de una herramienta de IA.
 * Representa un ciclo completo: desde la solicitud hasta el resultado o error.
 */
export interface ToolRun {
  /** Identificador único de la ejecución */
  readonly id: string;
  /** ID del usuario que lanzó la ejecución */
  readonly userId: string;
  /** Tipo de herramienta ejecutada */
  readonly toolType: ToolType;
  /** Estado actual de la ejecución */
  readonly status: ToolRunStatus;
  /** Proveedor de IA utilizado */
  readonly provider: AIProviderType;
  /** Datos de entrada proporcionados por el usuario */
  readonly input: Record<string, unknown>;
  /** Resultado generado por la IA (null si no ha completado) */
  readonly output: Record<string, unknown> | null;
  /** Tokens consumidos durante la ejecución */
  readonly tokensUsed: number | null;
  /** Costo estimado en USD */
  readonly costEstimate: number | null;
  /** Duración total en milisegundos */
  readonly durationMs: number | null;
  /** Mensaje de error si la ejecución falló */
  readonly errorMessage: string | null;
  /** Fecha y hora de creación */
  readonly createdAt: Date;
  /** Fecha y hora de finalización (null si aún en progreso) */
  readonly completedAt: Date | null;
}

/**
 * Límites de uso por herramienta y nivel de plan.
 * Controla cuántas ejecuciones puede realizar un usuario según su suscripción.
 */
export interface UsageLimit {
  /** Herramienta a la que aplica el límite */
  readonly toolType: ToolType;
  /** Nivel de plan del usuario */
  readonly planTier: PlanTier;
  /** Máximo de ejecuciones permitidas por día */
  readonly maxRunsPerDay: number;
  /** Máximo de ejecuciones permitidas por mes */
  readonly maxRunsPerMonth: number;
  /** Tamaño máximo del input en bytes */
  readonly maxInputSize: number;
  /** Máximo de filas por importación (aplica a herramienta Excel) */
  readonly maxRowsPerImport: number;
}

/**
 * Estado de uso actual de un usuario para una herramienta específica.
 * Permite verificar rápidamente si el usuario puede ejecutar la herramienta.
 */
export interface UsageStatus {
  /** Herramienta consultada */
  readonly toolType: ToolType;
  /** Ejecuciones realizadas hoy */
  readonly runsToday: number;
  /** Ejecuciones realizadas este mes */
  readonly runsThisMonth: number;
  /** Límite diario configurado */
  readonly limitPerDay: number;
  /** Límite mensual configurado */
  readonly limitPerMonth: number;
  /** Indica si el usuario tiene permitido ejecutar la herramienta */
  readonly isAllowed: boolean;
  /** Ejecuciones restantes para hoy */
  readonly remainingToday: number;
  /** Ejecuciones restantes para este mes */
  readonly remainingThisMonth: number;
}

/**
 * Metadatos de un archivo exportado generado a partir de un resultado.
 * Registra el archivo producido para descarga posterior.
 */
export interface ExportRecord {
  /** Identificador único del registro de exportación */
  readonly id: string;
  /** ID de la ejecución que generó los datos exportados */
  readonly toolRunId: string;
  /** Formato del archivo exportado */
  readonly format: ExportFormat;
  /** Nombre del archivo generado */
  readonly fileName: string;
  /** URL pública o firmada para descarga */
  readonly fileUrl: string;
  /** Fecha y hora de creación del archivo */
  readonly createdAt: Date;
}
