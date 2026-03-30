import { Result } from '@shared/Result';
import { AppError } from '@shared/AppError';

/**
 * Registro de una decisión tomada por un agente de IA.
 * Se persiste para auditoría, compliance y mejora continua.
 */
export interface AIAuditEntry {
  /** Nombre del agente que tomó la decisión */
  agentName: string;
  /** Versión del agente */
  agentVersion?: string;

  /** Acción ejecutada */
  action: string;
  /** Resultado de la decisión */
  decision: 'approved' | 'rejected' | 'escalated' | 'suggested';
  /** Nivel de autonomía usado */
  autonomyLevel: 'full_auto' | 'suggest' | 'human_only';

  /** Confianza de la decisión (0.0 - 1.0) */
  confidence: number;
  /** Razonamiento del LLM */
  reasoning?: string;

  /** Tipo de entidad afectada */
  aggregateType: string;
  /** ID de la entidad afectada */
  aggregateId: string;

  /** Contexto financiero */
  amountInvolved?: number;
  currency?: string;

  /** Metadata del modelo */
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  costUsd?: number;

  /** Datos adicionales */
  metadata?: Record<string, unknown>;
}

export interface AIAuditRecord extends AIAuditEntry {
  id: string;
  humanReviewed: boolean;
  humanDecision?: 'confirmed' | 'overridden';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface AIAuditQuery {
  agentName?: string;
  aggregateType?: string;
  aggregateId?: string;
  decision?: string;
  fromDate?: Date;
  toDate?: Date;
  unreviewedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface AIAuditStats {
  totalDecisions: number;
  autoApproved: number;
  escalated: number;
  humanOverridden: number;
  averageConfidence: number;
  totalCostUsd: number;
}

/**
 * Puerto de Auditoría de IA.
 *
 * Toda decisión autónoma de los agentes DEBE ser registrada
 * a través de este puerto para:
 * - Compliance y trazabilidad
 * - Métricas de calidad de las decisiones
 * - Human-in-the-loop review
 * - Optimización de prompts basada en overrides
 */
export interface AIAuditPort {
  /** Registrar una decisión de IA */
  log(entry: AIAuditEntry): Promise<Result<string, AppError>>;

  /** Buscar auditorías por entidad */
  findByAggregate(
    aggregateType: string,
    aggregateId: string,
  ): Promise<Result<AIAuditRecord[], AppError>>;

  /** Obtener decisiones pendientes de revisión humana */
  findUnreviewed(
    limit?: number,
  ): Promise<Result<AIAuditRecord[], AppError>>;

  /** Marcar una decisión como revisada por humano */
  markReviewed(
    auditId: string,
    reviewedBy: string,
    humanDecision: 'confirmed' | 'overridden',
    notes?: string,
  ): Promise<Result<void, AppError>>;

  /** Consulta flexible */
  query(
    params: AIAuditQuery,
  ): Promise<Result<AIAuditRecord[], AppError>>;

  /** Estadísticas agregadas para dashboard */
  getStats(
    fromDate?: Date,
    toDate?: Date,
  ): Promise<Result<AIAuditStats, AppError>>;
}
