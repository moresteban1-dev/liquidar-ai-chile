import { Result } from '../../shared/Result';

/**
 * Nivel de autonomía para una decisión de IA.
 */
export type AutonomyLevel = 'full_auto' | 'suggest' | 'human_only';

/**
 * Umbrales de confianza por tipo de acción.
 * Por encima → auto. Por debajo de review → humano obligatorio.
 * Entre ambos → sugerencia para humano.
 */
export interface ConfidenceThresholds {
  autoApproveQuotation: number;
  autoAssignProvider: number;
  autoAdjustPricing: number;
  requireHumanReview: number;
}

/**
 * Contexto para evaluar una decisión.
 */
export interface DecisionContext {
  action: string;
  confidence: number;
  reasoning: string;
  financialImpact?: number;
  dataPoints?: Record<string, unknown>;
}

/**
 * Resultado de la evaluación de una decisión.
 */
export interface DecisionEvaluation {
  /** ¿Se aprueba la acción autónoma? */
  approved: boolean;
  /** Nivel de autonomía determinado */
  autonomyLevel: AutonomyLevel;
  /** Confianza reportada por el agente */
  confidence: number;
  /** ¿Requiere revisión humana? */
  requiresHumanReview: boolean;
  /** ¿Requiere escalación (alto impacto financiero)? */
  requiresEscalation: boolean;
  /** ¿Se activó el Kill Switch global? */
  isKillSwitchActive: boolean;
  /** Razonamiento de la evaluación */
  evaluationReason: string;
}

/**
 * Framework de Confianza para decisiones autónomas de IA.
 *
 * Determina si un agente de IA puede actuar de forma autónoma,
 * si debe sugerir para confirmación humana, o si la decisión
 * es exclusivamente humana.
 *
 * PRINCIPIO: "Trust but verify" — mayor impacto financiero
 * requiere mayor confianza o intervención humana.
 */
export class ConfidenceFramework {
  /** Umbral de monto alto (requiere más confianza) */
  private static readonly HIGH_VALUE_THRESHOLD = 500_000; // CLP

  /** Confianza mínima para auto en montos altos */
  private static readonly HIGH_VALUE_MIN_CONFIDENCE = 0.95;

  private static readonly DEFAULT_THRESHOLDS: ConfidenceThresholds = {
    autoApproveQuotation: 0.92,
    autoAssignProvider: 0.85,
    autoAdjustPricing: 0.90,
    requireHumanReview: 0.70,
  };

  private constructor(
    private readonly thresholds: ConfidenceThresholds,
  ) {
    Object.freeze(this.thresholds);
    Object.freeze(this);
  }

  /**
   * Crea framework con umbrales por defecto.
   */
  static withDefaults(): ConfidenceFramework {
    return new ConfidenceFramework({ ...ConfidenceFramework.DEFAULT_THRESHOLDS });
  }

  /**
   * Crea framework con umbrales personalizados.
   */
  static withThresholds(
    thresholds: Partial<ConfidenceThresholds>,
  ): Result<ConfidenceFramework, string> {
    const merged = {
      ...ConfidenceFramework.DEFAULT_THRESHOLDS,
      ...thresholds,
    };

    // Validar que los umbrales tienen sentido
    for (const [key, value] of Object.entries(merged)) {
      if (value < 0 || value > 1) {
        return Result.fail(
          `Threshold '${key}' must be between 0 and 1 (got: ${value})`,
        );
      }
    }

    if (merged.requireHumanReview >= merged.autoApproveQuotation) {
      return Result.fail(
        'requireHumanReview threshold must be lower than autoApproveQuotation',
      );
    }

    return Result.ok(new ConfidenceFramework(merged));
  }

  /**
   * Evalúa si una decisión de IA puede ejecutarse de forma autónoma.
   */
  evaluate(
    actionType: keyof ConfidenceThresholds,
    context: DecisionContext,
    options?: { globalKillSwitch?: boolean }
  ): DecisionEvaluation {
    const threshold = this.thresholds[actionType];
    const reviewThreshold = this.thresholds.requireHumanReview;
    const isKillSwitchActive = !!options?.globalKillSwitch;

    // 1. Determinar autonomía base por confianza
    let autonomyLevel: AutonomyLevel;
    let approved: boolean;

    if (isKillSwitchActive) {
      autonomyLevel = 'human_only';
      approved = false;
    } else if (context.confidence >= threshold) {
      autonomyLevel = 'full_auto';
      approved = true;
    } else if (context.confidence >= reviewThreshold) {
      autonomyLevel = 'suggest';
      approved = false;
    } else {
      autonomyLevel = 'human_only';
      approved = false;
    }

    // 2. Verificar escalación por impacto financiero
    const requiresEscalation = !isKillSwitchActive && this.checkEscalation(
      context.confidence,
      context.financialImpact,
    );

    // Si requiere escalación, degradar autonomía
    if (requiresEscalation && autonomyLevel === 'full_auto') {
      autonomyLevel = 'suggest';
      approved = false;
    }

    // 3. Construir razón de evaluación
    const evaluationReason = this.buildReason(
      actionType,
      context.confidence,
      threshold,
      autonomyLevel,
      requiresEscalation,
      isKillSwitchActive
    );

    return {
      approved,
      autonomyLevel,
      confidence: context.confidence,
      requiresHumanReview: autonomyLevel !== 'full_auto',
      requiresEscalation,
      isKillSwitchActive,
      evaluationReason,
    };
  }

  /**
   * Verifica si un monto + confianza requieren escalación.
   */
  private checkEscalation(
    confidence: number,
    financialImpact?: number,
  ): boolean {
    if (!financialImpact) return false;

    return (
      financialImpact > ConfidenceFramework.HIGH_VALUE_THRESHOLD &&
      confidence < ConfidenceFramework.HIGH_VALUE_MIN_CONFIDENCE
    );
  }

  /**
   * Genera una explicación legible de la evaluación.
   */
  private buildReason(
    actionType: string,
    confidence: number,
    threshold: number,
    level: AutonomyLevel,
    escalated: boolean,
    killed: boolean
  ): string {
    const parts: string[] = [];

    parts.push(
      `Action: ${actionType}, Confidence: ${(confidence * 100).toFixed(1)}%, Threshold: ${(threshold * 100).toFixed(1)}%`,
    );

    if (killed) {
      parts.push('EMERGENCY: GLOBAL KILL SWITCH ACTIVE. ALL ACTIONS REQUIRE HUMAN REVIEW');
    } else if (level === 'full_auto') {
      parts.push('Decision: AUTO-APPROVED (confidence above threshold)');
    } else if (level === 'suggest') {
      parts.push('Decision: SUGGESTION (confidence between review and auto thresholds)');
    } else {
      parts.push('Decision: HUMAN-ONLY (confidence below review threshold)');
    }

    if (escalated) {
      parts.push(
        `ESCALATED: Financial impact above ${ConfidenceFramework.HIGH_VALUE_THRESHOLD} CLP requires higher confidence`,
      );
    }

    return parts.join('. ');
  }

  /**
   * Obtiene los umbrales actuales (para display en admin).
   */
  getThresholds(): Readonly<ConfidenceThresholds> {
    return this.thresholds;
  }
}
