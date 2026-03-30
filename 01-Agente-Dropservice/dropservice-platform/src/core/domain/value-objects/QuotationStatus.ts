import { Result } from '../../shared/Result';

export type QuotationStatusValue =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'AWAITING_PROVIDER'
  | 'NEGOTIATING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENT_TO_CLIENT'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'CANCELLED'
  | 'COMPLETED';

const VALID_TRANSITIONS: Record<QuotationStatusValue, QuotationStatusValue[]> = {
  DRAFT:              ['PENDING_REVIEW', 'CANCELLED'],
  PENDING_REVIEW:     ['AWAITING_PROVIDER', 'APPROVED', 'REJECTED', 'CANCELLED'],
  AWAITING_PROVIDER:  ['NEGOTIATING', 'APPROVED', 'CANCELLED'],
  NEGOTIATING:        ['APPROVED', 'REJECTED', 'AWAITING_PROVIDER', 'CANCELLED'],
  APPROVED:           ['SENT_TO_CLIENT', 'CANCELLED'],
  REJECTED:           ['DRAFT'],
  SENT_TO_CLIENT:     ['AWAITING_PAYMENT', 'CANCELLED'],
  AWAITING_PAYMENT:   ['PAID', 'CANCELLED'],
  PAID:               ['COMPLETED'],
  CANCELLED:          [],
  COMPLETED:          [],
};

const STATUS_LABELS: Record<QuotationStatusValue, string> = {
  DRAFT:              'Borrador',
  PENDING_REVIEW:     'Pendiente de Revisión',
  AWAITING_PROVIDER:  'Esperando Proveedor',
  NEGOTIATING:        'En Negociación',
  APPROVED:           'Aprobada',
  REJECTED:           'Rechazada',
  SENT_TO_CLIENT:     'Enviada al Cliente',
  AWAITING_PAYMENT:   'Esperando Pago',
  PAID:               'Pagada',
  CANCELLED:          'Cancelada',
  COMPLETED:          'Completada',
};

const STATUS_COLORS: Record<QuotationStatusValue, string> = {
  DRAFT:              'gray',
  PENDING_REVIEW:     'yellow',
  AWAITING_PROVIDER:  'orange',
  NEGOTIATING:        'blue',
  APPROVED:           'green',
  REJECTED:           'red',
  SENT_TO_CLIENT:     'indigo',
  AWAITING_PAYMENT:   'amber',
  PAID:               'emerald',
  CANCELLED:          'red',
  COMPLETED:          'green',
};

/**
 * Mapa de compatibilidad: valores en español → inglés.
 * Permite hidratar entidades desde DB con datos legacy.
 */
const LEGACY_MAP: Record<string, QuotationStatusValue> = {
  'BORRADOR':            'DRAFT',
  'PENDIENTE':           'PENDING_REVIEW',
  'PENDIENTE_REVISION':  'PENDING_REVIEW',
  'ESPERANDO_PROVEEDOR': 'AWAITING_PROVIDER',
  'EN_NEGOCIACION':      'NEGOTIATING',
  'APROBADO':            'APPROVED',
  'APROBADA':            'APPROVED',
  'RECHAZADO':           'REJECTED',
  'RECHAZADA':           'REJECTED',
  'ENVIADO':             'SENT_TO_CLIENT',
  'ENVIADA':             'SENT_TO_CLIENT',
  'ESPERANDO_PAGO':      'AWAITING_PAYMENT',
  'PAGADO':              'PAID',
  'PAGADA':              'PAID',
  'CANCELADO':           'CANCELLED',
  'CANCELADA':           'CANCELLED',
  'COMPLETADO':          'COMPLETED',
  'COMPLETADA':          'COMPLETED',
  'ACTIVO':              'PENDING_REVIEW',
  'ACTIVA':              'PENDING_REVIEW',
};

export class QuotationStatus {
  private constructor(
    private readonly _value: QuotationStatusValue,
  ) {
    Object.freeze(this);
  }

  static create(value: string): Result<QuotationStatus, string> {
    const normalized = QuotationStatus.normalize(value);
    if (!normalized) {
      return Result.fail(
        `Invalid quotation status: "${value}". ` +
        `Valid: ${Object.keys(VALID_TRANSITIONS).join(', ')}`,
      );
    }
    return Result.ok(new QuotationStatus(normalized));
  }

  static draft(): QuotationStatus {
    return new QuotationStatus('DRAFT');
  }

  /**
   * Reconstruye desde DB — acepta valores legacy en español.
   * NUNCA falla — usa DRAFT como fallback.
   */
  static reconstitute(value: string): QuotationStatus {
    const normalized = QuotationStatus.normalize(value);
    return new QuotationStatus(normalized ?? 'DRAFT');
  }

  get value(): QuotationStatusValue {
    return this._value;
  }

  get label(): string {
    return STATUS_LABELS[this._value];
  }

  get color(): string {
    return STATUS_COLORS[this._value];
  }

  canTransitionTo(newStatus: QuotationStatusValue): boolean {
    return VALID_TRANSITIONS[this._value].includes(newStatus);
  }

  transitionTo(
    newStatus: QuotationStatusValue,
  ): Result<QuotationStatus, string> {
    if (!this.canTransitionTo(newStatus)) {
      const allowed = VALID_TRANSITIONS[this._value];
      return Result.fail(
        `Invalid transition: ${this._value} → ${newStatus}. ` +
        `Allowed: [${allowed.join(', ')}]` +
        (allowed.length === 0 ? ' (terminal state)' : ''),
      );
    }
    return Result.ok(new QuotationStatus(newStatus));
  }

  allowedTransitions(): QuotationStatusValue[] {
    return [...VALID_TRANSITIONS[this._value]];
  }

  isTerminal(): boolean {
    return VALID_TRANSITIONS[this._value].length === 0;
  }

  isDraft(): boolean { return this._value === 'DRAFT'; }
  isPending(): boolean { return this._value === 'PENDING_REVIEW'; }
  isApproved(): boolean { return this._value === 'APPROVED'; }
  isRejected(): boolean { return this._value === 'REJECTED'; }
  isPaid(): boolean { return this._value === 'PAID'; }
  isCancelled(): boolean { return this._value === 'CANCELLED'; }
  isCompleted(): boolean { return this._value === 'COMPLETED'; }
  isCancellable(): boolean { return this.canTransitionTo('CANCELLED'); }

  requiresAction(): boolean {
    return ['PENDING_REVIEW', 'AWAITING_PROVIDER', 'NEGOTIATING', 'AWAITING_PAYMENT'].includes(this._value);
  }

  equals(other: QuotationStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON() {
    return {
      value: this._value,
      label: this.label,
      color: this.color,
      isTerminal: this.isTerminal(),
      allowedTransitions: this.allowedTransitions(),
    };
  }

  /**
   * Normaliza un valor de status, aceptando valores legacy en español.
   */
  private static normalize(value: string): QuotationStatusValue | null {
    if (!value) return null;
    const upper = value.toUpperCase().trim();

    // Primero verificar si ya es un valor válido en inglés
    if (Object.keys(VALID_TRANSITIONS).includes(upper)) {
      return upper as QuotationStatusValue;
    }

    // Buscar en mapa legacy
    if (LEGACY_MAP[upper]) {
      return LEGACY_MAP[upper];
    }

    return null;
  }

  static allStatuses(): QuotationStatusValue[] {
    return Object.keys(VALID_TRANSITIONS) as QuotationStatusValue[];
  }
}
