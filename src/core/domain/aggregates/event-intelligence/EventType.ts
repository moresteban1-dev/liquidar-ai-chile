/**
 * DOMAIN AGGREGATE: EventType
 * Represents a template for an event configuration (e.g., "Corporate Workshop").
 * 
 * SPRINT 5.1: Basic properties for identification and categorization.
 * TODO Sprint 5.2: Add relationships with ServiceNodes and complex logic.
 */

import { Result, ok, fail } from '@/core/shared/Result';

export interface EventTypeProps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  baseCategory: string;
  isActive: boolean;
}

export class EventType {
  private constructor(private readonly props: EventTypeProps) {}

  /**
   * Factory method to create a new EventType with validation.
   */
  static create(props: EventTypeProps): Result<EventType, string> {
    if (!props.code || props.code.trim() === '') {
      return fail('EventType: code is required');
    }
    if (!props.name || props.name.trim() === '') {
      return fail('EventType: name is required');
    }
    return ok(new EventType({
      ...props,
      isActive: props.isActive ?? true
    }));
  }

  /**
   * Reconstitutes an EventType from persistence data.
   */
  static reconstitute(props: EventTypeProps): EventType {
    return new EventType(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get baseCategory(): string { return this.props.baseCategory; }
  get isActive(): boolean { return this.props.isActive; }

  /**
   * Converts the entity to a plain JSON object.
   */
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      baseCategory: this.baseCategory,
      isActive: this.isActive
    };
  }
}
