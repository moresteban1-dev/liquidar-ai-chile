import type { Result } from '@core/shared/Result';
import type { AppError } from '@core/shared/AppError';
import type { ToolRun, ToolType, UsageStatus } from '@core/domain/tools/tool-execution.types';

/** Contrato para persistencia de ejecuciones de herramientas */
export interface IToolRunRepository {
  /** Crear un nuevo registro de ejecución */
  create(run: Omit<ToolRun, 'id' | 'createdAt' | 'completedAt'>): Promise<Result<ToolRun, AppError>>;
  
  /** Actualizar estado y resultado de una ejecución */
  update(id: string, data: Partial<Pick<ToolRun, 'status' | 'output' | 'tokensUsed' | 'costEstimate' | 'durationMs' | 'errorMessage' | 'completedAt'>>): Promise<Result<void, AppError>>;
  
  /** Obtener ejecución por ID */
  findById(id: string): Promise<Result<ToolRun | null, AppError>>;
  
  /** Listar ejecuciones del usuario */
  findByUser(userId: string, options?: { toolType?: ToolType; limit?: number; offset?: number }): Promise<Result<ToolRun[], AppError>>;
  
  /** Obtener estado de uso actual del usuario */
  getUsageStatus(userId: string, toolType: ToolType): Promise<Result<UsageStatus, AppError>>;
}
