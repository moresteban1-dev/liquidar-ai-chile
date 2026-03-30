import DataLoader from 'dataloader';
// import { Result } from '@core/shared/Result';

/**
 * Base infrastructure for DataLoaders.
 * 
 * Provides a standardized way to batch and cache database requests
 * within the context of a single request or command execution.
 */
export class LoaderRegistry {
    private loaders: Map<string, DataLoader<any, any>> = new Map();

    /**
     * Retrieves or creates a loader by its name.
     */
    public getLoader<K, V>(name: string, batchFn: (keys: readonly K[]) => Promise<(V | Error)[]>): DataLoader<K, V> {
        let loader = this.loaders.get(name);
        if (!loader) {
            loader = new DataLoader<K, V>(batchFn, {
                cache: true,
                maxBatchSize: 100
            });
            this.loaders.set(name, loader);
        }
        return loader as DataLoader<K, V>;
    }
}

export const loaderRegistry = new LoaderRegistry();
