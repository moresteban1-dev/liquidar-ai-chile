import { EventType } from '@/core/domain/aggregates/event-intelligence/EventType';
import { ServiceNode } from '@/core/domain/entities/event-intelligence/ServiceNode';
import { ConfigurationSession } from '@/core/domain/event-intelligence/types';
import { Result } from '@/core/shared/Result';
import { AppError } from '@/core/shared/AppError';

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
  findAllEventTypes(): Promise<Result<EventType[], AppError>>;
  findEventTypeByCode(code: string): Promise<Result<EventType | null, AppError>>;
  findAllServiceNodes(): Promise<Result<ServiceNode[], AppError>>;
  findServiceNodeByCode(code: string): Promise<Result<ServiceNode | null, AppError>>;
  findServiceNodeById(id: string): Promise<Result<ServiceNode | null, AppError>>;
  findEssentialNodes(): Promise<Result<ServiceNode[], AppError>>;
  findDependenciesByParentId(parentId: string): Promise<Result<ServiceDependency[], AppError>>;
  findBaselineNodesByEventType(eventTypeId: string): Promise<Result<BaselineNode[], AppError>>;
  findScalingRulesByNodeId(nodeId: string): Promise<Result<ScalingRule[], AppError>>;
  saveConfigurationSession(session: ConfigurationSession): Promise<Result<void, AppError>>;
  getConfigurationSession(sessionId: string): Promise<Result<ConfigurationSession | null, AppError>>;
}
