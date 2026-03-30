import { EventType } from '@/core/domain/aggregates/event-intelligence/EventType';
import { ServiceNode } from '@/core/domain/entities/event-intelligence/ServiceNode';
import { ConfigurationSession } from '@/core/domain/event-intelligence/types';
import { Result } from '@/core/shared/Result';

/**
 * PORT: IKnowledgeRepository
 * Defines the contract for accessing the Event Configuration Knowledge Graph.
 * 
 * SPRINT 5.2: Added session management and baseline/dependency resolution.
 */
export interface ServiceDependency {
  parentId: string;
  childId: string;
  dependencyType: 'REQUIRED' | 'OPTIONAL' | 'RECOMMENDED';
  minQuantity?: number;
}

export interface BaselineNode {
  nodeId: string;
  nodeCode: string;
  nodeName: string;
  priority: number;
}

export interface ScalingRule {
  nodeId: string;
  ruleType: 'LINEAR' | 'STAIRCASE' | 'FIXED';
  parameterTarget: string;
  baseQuantity: number;
  divisor: number;
  maxQuantity: number;
}

/**
 * PORT: IKnowledgeRepository
 * Defines the contract for accessing the Event Configuration Knowledge Graph.
 */
export interface IKnowledgeRepository {
  findAllEventTypes(): Promise<Result<EventType[], Error>>;
  findEventTypeByCode(code: string): Promise<Result<EventType | null, Error>>;
  findAllServiceNodes(): Promise<Result<ServiceNode[], Error>>;
  findServiceNodeByCode(code: string): Promise<Result<ServiceNode | null, Error>>;
  findServiceNodeById(id: string): Promise<Result<ServiceNode | null, Error>>;
  findEssentialNodes(): Promise<Result<ServiceNode[], Error>>;
  findDependenciesByParentId(parentId: string): Promise<Result<ServiceDependency[], Error>>;
  findBaselineNodesByEventType(eventTypeId: string): Promise<Result<BaselineNode[], Error>>;
  findScalingRulesByNodeId(nodeId: string): Promise<Result<ScalingRule[], Error>>;
  saveConfigurationSession(session: ConfigurationSession): Promise<Result<void, Error>>;
  getConfigurationSession(sessionId: string): Promise<Result<ConfigurationSession | null, Error>>;
}
