import { Address } from '../value-objects/Address';
import { ServiceDependency, ScalingRule } from '@app/ports/IKnowledgeRepository';

/**
 * Core Domain Models para el Event Configuration Intelligence Engine.
 * Sigue los principios de DDD (Domain-Driven Design).
 */

export type ConfigurationSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'CONVERTED';
export type DependencyType = 'REQUIRES' | 'RECOMMENDS' | 'INCOMPATIBLE_WITH';
export type RuleType = 'LINEAR' | 'STEP' | 'FIXED' | 'LOGARITHMIC';
export type ParameterTarget = 'ATTENDEES' | 'SQUARE_METERS' | 'HOURS';

/**
 * Representa las condiciones físicas y logísticas esperadas del evento.
 */
export interface VenueSpec {
  isOutdoor: boolean;
  hasInHousePA?: boolean;
  squareMeters?: number;
  powerAvailableKw?: number;
  setupHoursRestriction?: number;
  address?: Address;
}

/**
 * El "perfil" base del evento provisto por el usuario (el input de la ecuación).
 */
export interface EventProfile {
  eventTypeId: string;      // ID de la tabla event_types
  attendees: number;        // Cuanta gente va
  durationHours: number;    // Cuanto dura
  eventDate?: Date;         // Cuando es
  venue?: VenueSpec;        // Donde es y qué características logísticas tiene
}

/**
 * El resultado de una inferencia del motor para un nodo en particular.
 */
export interface InferredNeed {
  serviceNodeId: string;    // ID del servicio/equipo abstracto (ej. PA_SYSTEM_500)
  nodeCode: string;         // 'PA_SYSTEM_500'
  nodeName: string;         // 'Sistema PA hasta 500 personas'
  quantityInferred: number; // ¿Cuántos de estos calculó que necesitamos?
  isEssential: boolean;     // ¿Es crítico o es "nice to have"?
  reasoning: string[];      // Lista de razones ("Por scaling_rule baños: 500 pax / 150 = 4 baños")
  confidenceScore: number;  // 0.0 a 1.0, qué tan seguro está el motor
}

/**
 * La representación de la sesión del usuario configurando el evento.
 */
export interface ConfigurationSession {
  id: string;
  clientId: string | null;
  baseProfile: EventProfile;
  inferredGraph: InferredNeed[]; // El resultado final del cálculo topológico
  status: ConfigurationSessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ScalingRule and ServiceDependency are now imported from IKnowledgeRepository

export interface ServiceNode {
  id: string;
  code: string;
  name: string;
  nodeType: 'EQUIPMENT' | 'STAFF' | 'SERVICE' | 'DELIVERABLE';
  isEssential: boolean;
  dependencies: ServiceDependency[]; // Edges que salen de este nodo
  scalingRules: ScalingRule[];       // Ecuaciones matemáticas asociadas
}

export interface EventTypeGraph {
  id: string;
  code: string;
  name: string;
  baseNodes: Array<{
    node: ServiceNode;
    priority: number;
  }>;
}
