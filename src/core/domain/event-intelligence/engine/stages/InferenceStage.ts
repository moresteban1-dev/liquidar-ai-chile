import { Result } from '@/core/shared/Result';
import { InferenceContext } from '../InferenceTypes';

export interface InferenceStage {
  /**
   * Modifica el `context` mutando el Map `needs`
   */
  execute(context: InferenceContext): Promise<Result<void, Error>>;
}
