import { SupabaseClient } from '@supabase/supabase-js';
import { IKnowledgeRepository, ServiceDependency, BaselineNode, ScalingRule } from '@app/ports/IKnowledgeRepository';
import { EventType } from '@/core/domain/aggregates/event-intelligence/EventType';
import { ServiceNode } from '@/core/domain/entities/event-intelligence/ServiceNode';
import { ConfigurationSession, EventProfile } from '@/core/domain/event-intelligence/types';
import { Address } from '@/core/domain/value-objects/Address';
import { Result, ok, fail } from '@/core/shared/Result';

export interface EventTypeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  base_category: string;
  is_active: boolean;
}

export interface ServiceNodeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  node_type: string;
  is_essential: boolean;
  is_active: boolean;
}

export interface ServiceDependencyRow {
  parent_node_id: string;
  child_node_id: string;
  dependency_type: string;
  min_quantity: number;
}

export interface ScalingRuleRow {
  service_node_id: string;
  rule_type: string;
  parameter_target: string;
  base_quantity: number;
  divisor: number;
  max_quantity: number;
}

/**
 * ADAPTER: SupabaseKnowledgeRepository
 * Implements IKnowledgeRepository using Supabase as the persistence provider.
 */
export class SupabaseKnowledgeRepository implements IKnowledgeRepository {
  constructor(private readonly client: SupabaseClient) {}

  // ============================================================================
  // EVENT TYPES
  // ============================================================================

  async findAllEventTypes(): Promise<Result<EventType[], Error>> {
    const { data, error } = await this.client
      .from('event_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch event types: ${error.message}`));
    }

    return ok((data as EventTypeRow[] || []).map(row => this.mapToEventType(row)));
  }

  async findEventTypeByCode(code: string): Promise<Result<EventType | null, Error>> {
    const { data, error } = await this.client
      .from('event_types')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return ok(null);
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch event type: ${error.message}`));
    }

    if (!data) return ok(null);
    return ok(this.mapToEventType(data as EventTypeRow));
  }

  // ============================================================================
  // SERVICE NODES
  // ============================================================================

  async findAllServiceNodes(): Promise<Result<ServiceNode[], Error>> {
    const { data, error } = await this.client
      .from('service_nodes')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch service nodes: ${error.message}`));
    }

    return ok((data as ServiceNodeRow[] || []).map(row => this.mapToServiceNode(row)));
  }

  async findServiceNodeByCode(code: string): Promise<Result<ServiceNode | null, Error>> {
    const { data, error } = await this.client
      .from('service_nodes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return ok(null);
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch service node: ${error.message}`));
    }

    if (!data) return ok(null);
    return ok(this.mapToServiceNode(data as ServiceNodeRow));
  }

  async findServiceNodeById(id: string): Promise<Result<ServiceNode | null, Error>> {
    const { data, error } = await this.client
      .from('service_nodes')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return ok(null);
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch service node: ${error.message}`));
    }

    if (!data) return ok(null);
    return ok(this.mapToServiceNode(data as ServiceNodeRow));
  }

  async findEssentialNodes(): Promise<Result<ServiceNode[], Error>> {
    const { data, error } = await this.client
      .from('service_nodes')
      .select('*')
      .eq('is_active', true)
      .eq('is_essential', true)
      .order('name');

    if (error) {
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch essential nodes: ${error.message}`));
    }

    return ok((data as ServiceNodeRow[] || []).map(row => this.mapToServiceNode(row)));
  }

  async findDependenciesByParentId(parentId: string): Promise<Result<ServiceDependency[], Error>> {
    const { data, error } = await this.client
      .from('service_dependencies')
      .select('*')
      .eq('parent_node_id', parentId)
      .eq('is_active', true);

    if (error) {
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch dependencies: ${error.message}`));
    }

    const dependencies: ServiceDependency[] = (data as ServiceDependencyRow[] || []).map(raw => ({
      parentId: raw.parent_node_id,
      childId: raw.child_node_id,
      dependencyType: raw.dependency_type as any,
      minQuantity: raw.min_quantity
    }));

    return ok(dependencies);
  }

  async findBaselineNodesByEventType(eventTypeId: string): Promise<Result<BaselineNode[], Error>> {
    const { data, error } = await this.client
      .from('event_type_service_nodes')
      .select(`
        priority,
        service_node:service_nodes (
          id,
          code,
          name
        )
      `)
      .eq('event_type_id', eventTypeId);

    if (error) {
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch baseline nodes: ${error.message}`));
    }

    const nodes: BaselineNode[] = (data as any[] || []).map(raw => ({
      nodeId: raw.service_node.id,
      nodeCode: raw.service_node.code,
      nodeName: raw.service_node.name,
      priority: raw.priority
    }));

    return ok(nodes);
  }

  async saveConfigurationSession(session: ConfigurationSession): Promise<Result<void, Error>> {
    const { error } = await this.client
      .from('event_configuration_sessions')
      .upsert({
        id: session.id,
        client_id: session.clientId,
        event_type_id: session.baseProfile.eventTypeId,
        base_parameters: session.baseProfile,
        inferred_nodes: session.inferredGraph,
        status: session.status,
        updated_at: session.updatedAt.toISOString()
      });

    if (error) return fail(new Error(`SupabaseKnowledgeRepository: Failed to save session: ${error.message}`));
    return ok(undefined);
  }

  async getConfigurationSession(sessionId: string): Promise<Result<ConfigurationSession | null, Error>> {
    const { data, error } = await this.client
      .from('event_configuration_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return ok(null);
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch session: ${error.message}`));
    }

    if (!data) return ok(null);

    const baseProfile = data.base_parameters as EventProfile;
    if (baseProfile.venue?.address) {
      const addressResult = Address.create(baseProfile.venue.address as any);
      if (addressResult.isSuccess()) {
        baseProfile.venue.address = addressResult.getValue();
      }
    }

    return ok({
      id: data.id,
      clientId: data.client_id,
      baseProfile,
      inferredGraph: data.inferred_nodes,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });
  }

  async findScalingRulesByNodeId(nodeId: string): Promise<Result<ScalingRule[], Error>> {
    const { data, error } = await this.client
      .from('scaling_rules')
      .select('*')
      .eq('service_node_id', nodeId);

    if (error) {
      return fail(new Error(`SupabaseKnowledgeRepository: Failed to fetch scaling rules: ${error.message}`));
    }

    const rules: ScalingRule[] = (data as ScalingRuleRow[] || []).map(r => ({
      nodeId: r.service_node_id,
      ruleType: r.rule_type as any,
      parameterTarget: r.parameter_target,
      baseQuantity: r.base_quantity,
      divisor: r.divisor,
      maxQuantity: r.max_quantity
    }));

    return ok(rules);
  }

  // ============================================================================
  // MAPPERS (Private)
  // ============================================================================

  private mapToEventType(raw: EventTypeRow): EventType {
    return EventType.reconstitute({
      id: raw.id,
      code: raw.code,
      name: raw.name,
      description: raw.description,
      baseCategory: raw.base_category,
      isActive: raw.is_active
    });
  }

  private mapToServiceNode(raw: ServiceNodeRow): ServiceNode {
    return ServiceNode.reconstitute({
      id: raw.id,
      code: raw.code,
      name: raw.name,
      description: raw.description,
      nodeType: raw.node_type as any,
      isEssential: raw.is_essential,
      isActive: raw.is_active
    });
  }
}
