import { EventProfile, InferredNeed } from '../types';
import { IKnowledgeRepository as KnowledgeRepository } from '@app/ports/IKnowledgeRepository';
import { Result } from '@/core/shared/Result';

/**
 * Contexto que muta a lo largo del pipeline de inferencia.
 */
export interface InferenceContext {
  profile: EventProfile;
  repository: KnowledgeRepository;
  needs: Map<string, InferredNeed>; // Key: nodeCode
}

/**
 * Interfaz base para todas las etapas del motor de inferencia.
 * Sigue el patrón Pipe & Filter.
 */
export interface InferenceStage {
  /**
   * Modifica el `context` mutando el Map `needs`
   */
  execute(context: InferenceContext): Promise<Result<void, Error>>;
}
