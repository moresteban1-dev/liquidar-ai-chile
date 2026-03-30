import { InferredNeed } from './types';
import { CatalogItem } from '../catalog/CatalogTypes';
import { CatalogRepository } from '../../application/ports/CatalogRepository';
import { Logger } from '../ports/Logger';

/**
 * ProductMatcher
 * 
 * Servicio de dominio encargado de encontrar coincidencias entre las necesidades
 * inferidas por la IA y los ítems reales disponibles en el catálogo.
 */
export class ProductMatcher {
  constructor(
    private readonly catalogRepo: CatalogRepository,
    private readonly logger?: Logger
  ) {}

  /**
   * Encuentra los mejores candidatos del catálogo para una necesidad específica.
   */
  async findBestMatches(need: InferredNeed): Promise<CatalogItem[]> {
    try {
      this.logger?.debug('Iniciando matching para necesidad', { nodeCode: need.nodeCode });

      // 1. Estrategia A: Búsqueda por Código exacto (o coincidencia fuerte en búsqueda)
      const exactResult = await this.catalogRepo.getItems({
        search: need.nodeCode,
        statusFilter: 'active'
      });

      if (exactResult.isSuccess()) {
        const exactMatches = exactResult.getValue();
        if (exactMatches.length > 0) {
          this.logger?.debug('Match encontrado por código/búsqueda', { 
            nodeCode: need.nodeCode, 
            count: exactMatches.length 
          });
          return exactMatches;
        }
      }

      // 2. Estrategia B: Búsqueda por Etiquetas (Tags)
      // Usamos el nodeCode como una etiqueta semántica
      const tagResult = await this.catalogRepo.getItems({
        tags: [need.nodeCode],
        statusFilter: 'active'
      });

      if (tagResult.isSuccess()) {
        const tagMatches = tagResult.getValue();
        if (tagMatches.length > 0) {
          this.logger?.debug('Match encontrado por tags', { 
            nodeCode: need.nodeCode, 
            count: tagMatches.length 
          });
          return tagMatches;
        }
      }

      this.logger?.warn('No se encontraron coincidencias en el catálogo para la necesidad', { 
        nodeCode: need.nodeCode 
      });
      return [];

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger?.error('Error en ProductMatcher:', err);
      return [];
    }
  }
}
