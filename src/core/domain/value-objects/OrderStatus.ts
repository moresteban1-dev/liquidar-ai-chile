import { Result } from '../../shared/Result';

/**
 * Estados posibles de una Orden.
 * Cada estado es un nodo en la máquina de estados.
 */
export type OrderStatusValue =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'ASSIGNED'
  | 'IN_PRODUCTION'
  | 'INTERNAL_REVIEW'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED';

/**
 * Definición explícita de transiciones válidas.
 *
 * Cada estado mapea a los estados a los que puede transicionar.
 * Si un estado mapea a [], es un estado terminal.
 */
const VALID_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  DRAFT:           ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED:  ['PENDING_PAYMENT', 'CANCELLED'],
  PAID:            ['ASSIGNED', 'CANCELLED'],
  ASSIGNED:        ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION:   ['INTERNAL_REVIEW', 'CANCELLED'],
  INTERNAL_REVIEW: ['UNDER_REVIEW', 'IN_PRODUCTION', 'CANCELLED'],
  UNDER_REVIEW:    ['DELIVERED', 'REVISION_REQUESTED', 'CANCELLED'],
  REVISION_REQUESTED: ['IN_PRODUCTION', 'CANCELLED'],
  DELIVERED:       ['COMPLETED', 'DISPUTED'],
  COMPLETED:       [],       // Terminal
  CANCELLED:       [],       // Terminal
  REFUNDED:        [],       // Terminal
  DISPUTED:        ['REFUNDED', 'COMPLETED'],
};

/**
 * Etiquetas legibles para UI.
 */
const STATUS_LABELS: Record<OrderStatusValue, string> = {
  DRAFT:           'Borrador',
  PENDING_PAYMENT: 'Pendiente de Pago',
  PAYMENT_FAILED:  'Pago Fallido',
  PAID:            'Pagada',
  ASSIGNED:        'Asignada',
  IN_PRODUCTION:   'En Producción',
  INTERNAL_REVIEW: 'Revisión Interna',
  UNDER_REVIEW:    'En Revisión (Cliente)',
  REVISION_REQUESTED: 'Con Observaciones',
  DELIVERED:       'Entregada',
  COMPLETED:       'Completada',
  CANCELLED:       'Cancelada',
  REFUNDED:        'Reembolsada',
  DISPUTED:        'En Disputa',
};


/**
 * Contexto para evaluar una transición.
 */
export interface TransitionContext {
  /** ID del usuario que ejecuta la transición */
  performedBy?: string;
  /** Rol del usuario */
  role?: string;
  /** Monto de la orden */
  orderAmount?: number;
  /** ¿Tiene pago confirmado? */
  paymentConfirmed?: boolean;
  /** ¿Pasó QA? */
  qaApproved?: boolean;
  /** Motivo de la transición */
  reason?: string;
}

/**
 * Guards: condiciones adicionales para transiciones.
 * Retornan string con motivo de rechazo, o null si OK.
 */
type TransitionGuard = (context?: TransitionContext) => string | null;

const TRANSITION_GUARDS: Partial<
  Record<OrderStatusValue, Partial<Record<OrderStatusValue, TransitionGuard>>>
> = {
  PENDING_PAYMENT: {
    PAID: (ctx) => {
      if (!ctx?.paymentConfirmed) {
        return 'Cannot mark as PAID without payment confirmation';
      }
      return null;
    },
  },
  INTERNAL_REVIEW: {
    UNDER_REVIEW: (ctx) => {
      if (ctx?.qaApproved === false) {
        return 'Cannot deliver without QA approval';
      }
      return null;
    },
    IN_PRODUCTION: (ctx) => {
      if (!ctx?.reason) {
        return 'Returning to IN_PRODUCTION requires a reason';
      }
      return null;
    },
  },
  DELIVERED: {
    DISPUTED: (ctx) => {
      if (!ctx?.reason) {
        return 'Opening a dispute requires a reason';
      }
      return null;
    },
  },
};

/**
 * Mapa de compatibilidad: valores en español → inglés.
 */
const ORDER_LEGACY_MAP: Record<string, OrderStatusValue> = {
  'BORRADOR':          'DRAFT',
  'PENDIENTE_PAGO':    'PENDING_PAYMENT',
  'ESPERANDO_PAGO':    'PENDING_PAYMENT',
  'PENDIENTE':         'PENDING_PAYMENT',
  'PAGO_FALLIDO':      'PAYMENT_FAILED',
  'PAGADO':            'PAID',
  'PAGADA':            'PAID',
  'ASIGNADA':          'ASSIGNED',
  'EN_PROGRESO':       'IN_PRODUCTION',
  'EN_PRODUCCION':     'IN_PRODUCTION',
  'REVISION_INTERNA':  'INTERNAL_REVIEW',
  'REVISION_CALIDAD':  'INTERNAL_REVIEW',
  'EN_REVISION':       'UNDER_REVIEW',
  'CON_OBSERVACIONES': 'REVISION_REQUESTED',
  'ENTREGADO':         'DELIVERED',
  'ENTREGADA':         'DELIVERED',
  'COMPLETADO':        'COMPLETED',
  'COMPLETADA':        'COMPLETED',
  'CANCELADO':         'CANCELLED',
  'CANCELADA':         'CANCELLED',
  'REEMBOLSADO':       'REFUNDED',
  'REEMBOLSADA':       'REFUNDED',
  'FINALIZADA':        'COMPLETED',
  'EN_DISPUTA':        'DISPUTED',
};

/**
 * Value Object: Estado de una Orden.
 *
 * Encapsula la máquina de estados con:
 * - Transiciones válidas definidas explícitamente
 * - Guards opcionales por transición
 * - Metadata para UI (labels, colores)
 * - Métodos de consulta (isTerminal, isPaid, etc.)
 */
export class OrderStatus {
  private constructor(
    private readonly _value: OrderStatusValue,
  ) {
    Object.freeze(this);
  }

  // ═══════════════════════════════════════════
  // Factories
  // ═══════════════════════════════════════════

  static create(value: string): Result<OrderStatus, string> {
    const normalized = OrderStatus.normalize(value);
    if (!normalized) {
      return Result.fail(
        `Invalid order status: "${value}". Valid values: ${Object.keys(VALID_TRANSITIONS).join(', ')}`,
      );
    }
    return Result.ok(new OrderStatus(normalized));
  }

  static draft(): OrderStatus {
    return new OrderStatus('DRAFT');
  }

  /**
   * Reconstituye un OrderStatus aceptando valores legacy en español.
   */
  static reconstitute(value: string): OrderStatus {
    const normalized = OrderStatus.normalize(value);
    return new OrderStatus(normalized ?? 'DRAFT');
  }

  /**
   * Normaliza un valor de status, aceptando valores legacy en español.
   */
  private static normalize(value: string): OrderStatusValue | null {
    if (!value) return null;
    const upper = value.toUpperCase().trim();

    // Ya es válido en inglés
    if (OrderStatus.isValidStatus(upper)) {
      return upper as OrderStatusValue;
    }

    // Buscar en mapa legacy
    if (ORDER_LEGACY_MAP[upper]) {
      return ORDER_LEGACY_MAP[upper];
    }

    return null;
  }

  // ═══════════════════════════════════════════
  // Getters
  // ═══════════════════════════════════════════

  get value(): OrderStatusValue {
    return this._value;
  }

  get label(): string {
    return STATUS_LABELS[this._value];
  }

  // ═══════════════════════════════════════════
  // Transiciones
  // ═══════════════════════════════════════════

  /**
   * Verifica si la transición es válida (sin ejecutar guards).
   */
  canTransitionTo(newStatus: string): boolean {
    if (!OrderStatus.isValidStatus(newStatus)) return false;
    return VALID_TRANSITIONS[this._value].includes(newStatus as OrderStatusValue);
  }

  /**
   * Ejecuta la transición con validación completa + guards.
   */
  transitionTo(
    newStatus: string,
    context?: TransitionContext,
  ): Result<OrderStatus, string> {
    // 1. Verificar si el estado es válido
    if (!OrderStatus.isValidStatus(newStatus)) {
        return Result.fail(`Invalid status name: ${newStatus}`);
    }

    const nextStatus = newStatus as OrderStatusValue;

    // 2. Verificar transición estructural
    if (!this.canTransitionTo(nextStatus)) {
      const allowed = this.allowedTransitions();
      return Result.fail(
        `Invalid transition: ${this._value} → ${nextStatus}. ` +
        `Allowed transitions from ${this._value}: [${allowed.join(', ')}]` +
        (allowed.length === 0 ? '. This is a terminal state.' : ''),
      );
    }

    // 3. Ejecutar guards si existen
    const guard = TRANSITION_GUARDS[this._value]?.[nextStatus];
    if (guard) {
      const rejection = guard(context);
      if (rejection) {
        return Result.fail(
          `Transition ${this._value} → ${nextStatus} blocked by guard: ${rejection}`,
        );
      }
    }

    // 4. Crear nuevo estado
    return Result.ok(new OrderStatus(nextStatus));
  }

  /**
   * Obtiene la lista de estados destino válidos.
   */
  allowedTransitions(): OrderStatusValue[] {
    return [...VALID_TRANSITIONS[this._value]];
  }

  // ═══════════════════════════════════════════
  // Predicados
  // ═══════════════════════════════════════════

  isTerminal(): boolean {
    return VALID_TRANSITIONS[this._value].length === 0;
  }

  isDraft(): boolean {
    return this._value === 'DRAFT';
  }

  isPendingPayment(): boolean {
    return this._value === 'PENDING_PAYMENT';
  }

  isPaid(): boolean {
    return ['PAID', 'ASSIGNED', 'IN_PRODUCTION', 'INTERNAL_REVIEW', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'DELIVERED', 'COMPLETED'].includes(
      this._value,
    );
  }

  isActive(): boolean {
    return ['PAID', 'ASSIGNED', 'IN_PRODUCTION', 'INTERNAL_REVIEW', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'DELIVERED'].includes(
      this._value,
    );
  }

  isCompleted(): boolean {
    return this._value === 'COMPLETED';
  }

  isCancelled(): boolean {
    return this._value === 'CANCELLED';
  }

  isRefunded(): boolean {
    return this._value === 'REFUNDED';
  }

  isDisputed(): boolean {
    return this._value === 'DISPUTED';
  }

  isCancellable(): boolean {
    return this.canTransitionTo('CANCELLED');
  }

  isRefundable(): boolean {
    return this.canTransitionTo('REFUNDED');
  }

  requiresAction(): boolean {
    return ['PENDING_PAYMENT', 'INTERNAL_REVIEW', 'UNDER_REVIEW', 'DISPUTED'].includes(
      this._value,
    );
  }

  // ═══════════════════════════════════════════
  // Igualdad y Serialización
  // ═══════════════════════════════════════════

  equals(other: OrderStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): {
    value: OrderStatusValue;
    label: string;
    isTerminal: boolean;
    allowedTransitions: OrderStatusValue[];
  } {
    return {
      value: this._value,
      label: this.label,
      isTerminal: this.isTerminal(),
      allowedTransitions: this.allowedTransitions(),
    };
  }

  // ═══════════════════════════════════════════
  // Static Utils
  // ═══════════════════════════════════════════

  static allStatuses(): OrderStatusValue[] {
    return Object.keys(VALID_TRANSITIONS) as OrderStatusValue[];
  }

  static terminalStatuses(): OrderStatusValue[] {
    return OrderStatus.allStatuses().filter(
      (s) => VALID_TRANSITIONS[s].length === 0,
    );
  }

  static activeStatuses(): OrderStatusValue[] {
    return ['PAID', 'ASSIGNED', 'IN_PRODUCTION', 'INTERNAL_REVIEW', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'DELIVERED'];
  }

  private static isValidStatus(value: string): value is OrderStatusValue {
    return Object.keys(VALID_TRANSITIONS).includes(value);
  }
}
