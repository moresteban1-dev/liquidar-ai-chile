import { Provider } from '@core/domain/aggregates/Provider';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { Result } from '@core/shared/Result';

/**
 * IProviderRepository - Port
 */

export interface IProviderRepository {
  findById(id: UniqueEntityID): Promise<Result<Provider | null, string>>;
  save(provider: Provider): Promise<Result<void, string>>;
  findByCategory(categoryId: string): Promise<Result<Provider[], string>>;
  findVerified(): Promise<Result<Provider[], string>>;
  delete(id: UniqueEntityID): Promise<Result<void, string>>;
}
