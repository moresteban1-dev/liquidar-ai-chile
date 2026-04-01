import { Result } from '@/core/shared/Result';
import { InferenceContext } from '../InferenceEngine';

export interface InferenceStage {
  /**
   * Modifica el `context` mutando el Map `needs`
   */
  execute(context: InferenceContext): Promise<Result<void, Error>>;
}
