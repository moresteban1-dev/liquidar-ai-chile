import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import type { ToolType, UsageStatus } from '@core/domain/tools/tool-execution.types';
import type { IToolRunRepository } from '@core/application/ports/IToolRunRepository';

/**
 * Servicio para verificar y hacer cumplir los límites de uso por herramienta.
 * Crucial para la escalabilidad y la futura monetización.
 */
export class ToolUsageGuard {
  constructor(private readonly repository: IToolRunRepository) {}

  /**
   * Verifica si el usuario puede ejecutar la herramienta especificada.
   */
  async checkCanExecute(userId: string, toolType: ToolType): Promise<Result<UsageStatus, AppError>> {
    try {
      const statusResult = await this.repository.getUsageStatus(userId, toolType);
      
      if (statusResult.isFailure()) {
        return fail(statusResult.error);
      }

      const status = statusResult.value;

      if (!status.isAllowed) {
        const reason = status.remainingToday <= 0 
          ? 'Límite diario alcanzado' 
          : 'Límite mensual alcanzado';
          
        return fail(AppError.business(
          `No puedes ejecutar esta herramienta: ${reason}. Actualiza tu plan para continuar.`
        ));
      }

      return ok(status);
    } catch (error: unknown) {
      return fail(AppError.infrastructure((error instanceof Error ? error.message : String(error)) || 'Error checking usage limits'));
    }
  }

  /**
   * Valida restricciones específicas del input (ej: tamaño de archivo, cantidad de filas)
   */
  async validateInputLimits(
    userId: string, 
    toolType: ToolType, 
    inputSizeOrRows: number
  ): Promise<Result<boolean, AppError>> {
    // Aquí implementamos la lógica de verificación de payload
    // Para el MVP, simplemente permitimos todo lo que llegue
    return ok(true);
  }
}
