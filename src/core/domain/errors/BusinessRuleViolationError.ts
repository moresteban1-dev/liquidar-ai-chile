import { DomainError } from './DomainError';

/**
 * BusinessRuleViolationError
 * 
 * Se lanza cuando se viola una regla de negocio
 */

export class BusinessRuleViolationError extends DomainError {
  constructor(
    public readonly rule: string,
    message?: string
  ) {
    super(message || `Business rule violated: ${rule}`);
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      rule: this.rule
    };
  }
}
