import { DomainError } from './DomainError';

/**
 * InvalidStateTransitionError
 * 
 * Se lanza cuando se intenta una transición de estado inválida
 */

export class InvalidStateTransitionError extends DomainError {
  constructor(
    public readonly fromState: string,
    public readonly toState: string
  ) {
    super(`Invalid state transition: ${fromState} -> ${toState}`);
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      fromState: this.fromState,
      toState: this.toState
    };
  }
}
