import { Result, ok, fail } from '@/core/shared/Result';

export type ServiceNodeType = 'EQUIPMENT' | 'STAFF' | 'INFRASTRUCTURE' | 'SERVICE';

export interface ServiceNodeProps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  nodeType: ServiceNodeType;
  isEssential: boolean;
  isActive: boolean;
}

export class ServiceNode {
  private constructor(private readonly props: ServiceNodeProps) {}

  /**
   * Factory method to create a new ServiceNode.
   */
  static create(props: ServiceNodeProps): Result<ServiceNode, string> {
    if (!props.code || props.code.trim() === '') {
      return fail('ServiceNode: code is required');
    }
    if (!props.name || props.name.trim() === '') {
      return fail('ServiceNode: name is required');
    }
    return ok(new ServiceNode({
      ...props,
      isActive: props.isActive ?? true,
      isEssential: props.isEssential ?? false
    }));
  }

  /**
   * Reconstitutes a ServiceNode from persistence.
   */
  static reconstitute(props: ServiceNodeProps): ServiceNode {
    return new ServiceNode(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get nodeType(): ServiceNodeType { return this.props.nodeType; }
  get isEssential(): boolean { return this.props.isEssential; }
  get isActive(): boolean { return this.props.isActive; }

  /**
   * Serializes the entity to a plane object.
   */
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      nodeType: this.nodeType,
      isEssential: this.isEssential,
      isActive: this.isActive
    };
  }
}
