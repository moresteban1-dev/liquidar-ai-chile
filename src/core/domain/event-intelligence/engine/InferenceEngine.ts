import { EventProfile, InferredNeed } from '../types';
import { BaseMappingStage } from './stages/BaseMappingStage';
import { DependencyResolutionStage } from './stages/DependencyResolutionStage';
import { QuantityScalingStage } from './stages/QuantityScalingStage';
import { IKnowledgeRepository as KnowledgeRepository } from '@app/ports/IKnowledgeRepository';
import { Result, ok } from '@/core/shared/Result';
import { InferenceStage } from './stages/InferenceStage';

/**
 * Contexto que muta a lo largo del pipeline.
 */
export interface InferenceContext {
  profile: EventProfile;
  repository: KnowledgeRepository;
  needs: Map<string, InferredNeed>; // Key: nodeCode
}

/**
 * Orquestador principal del motor topológico.
 * Aplica el patrón Pipes & Filters ("Pipeline").
 */
export class InferenceEngine {
  constructor(private readonly repository: KnowledgeRepository) {}

  /**
   * Ejecuta la tubería de inferencia completa sobre un perfil base.
   */
  async runInference(profile: EventProfile): Promise<Result<InferredNeed[], Error>> {
    // 1. Inicializar Contexto
    const context: InferenceContext = {
      profile,
      repository: this.repository,
      needs: new Map<string, InferredNeed>()
    };

    // 3. Definir e instanciar las etapas del Pipeline
    const stages: InferenceStage[] = [
      new BaseMappingStage(),
      new DependencyResolutionStage(),
      new QuantityScalingStage()
    ];

    // 4. Ejecutar Pipeline en order
    for (const stage of stages) {
      const result = await stage.execute(context);
      if (result.isFailure()) return result;
    }

    // 5. Retornar el resultado final aplanado y ordenado por nivel de confianza y criticidad
    const sortedNeeds = Array.from(context.needs.values()).sort((a, b) => {
      // Primero esenciales, luego por confidencceScore descentente
      if (a.isEssential === b.isEssential) {
        return b.confidenceScore - a.confidenceScore;
      }
      return a.isEssential ? -1 : 1;
    });

    return ok(sortedNeeds);
  }
}
