import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { trace, SpanStatusCode } from '@opentelemetry/api';

export interface RepositoryMapper<T, Row> {
    toDomain: (row: Row) => Result<T, AppError>;
    toRow: (domain: T) => Row;
}

export class SupabaseGenericRepository<T, Row extends Record<string, any>> {
    protected tableName: string;
    protected mapper: RepositoryMapper<T, Row>;
    private tracer = trace.getTracer('supabase-repository');

    constructor(
        protected readonly supabase: SupabaseClient,
        tableName: string, 
        mapper: RepositoryMapper<T, Row>
    ) {
        this.tableName = tableName;
        this.mapper = mapper;
    }

    protected async getClient() {
        return this.supabase;
    }

    async findById(id: string): Promise<Result<T | null, AppError>> {
        return await this.tracer.startActiveSpan(`${this.tableName}.findById`, async (span) => {
            try {
                const supabase = await this.getClient();
                const { data, error } = await supabase
                    .from(this.tableName)
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') return ok(null);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                    return fail(AppError.from(error));
                }

                if (!data) return ok(null);

                const domainRes = this.mapper.toDomain(data as Row);
                if (domainRes.isFailure()) {
                    const err = domainRes.getError();
                    span.setStatus({ code: SpanStatusCode.ERROR, message: `Mapping error: ${err.message}` });
                    return fail(err);
                }

                return ok(domainRes.getValue());
            } catch (error) {
                span.recordException(error as Error);
                return fail(AppError.from(error));
            } finally {
                span.end();
            }
        });
    }

    async save(entity: T): Promise<Result<void, AppError>> {
        return await this.tracer.startActiveSpan(`${this.tableName}.save`, async (span) => {
            try {
                const supabase = await this.getClient();
                const row = this.mapper.toRow(entity);
                const { error } = await supabase
                    .from(this.tableName)
                    .upsert(row as any);

                if (error) {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                    return fail(AppError.from(error));
                }

                return ok(undefined);
            } catch (error) {
                span.recordException(error as Error);
                return fail(AppError.from(error));
            } finally {
                span.end();
            }
        });
    }

    async findMany(filters: Partial<Row> = {}): Promise<T[]> {
        return await this.tracer.startActiveSpan(`${this.tableName}.findMany`, async (span) => {
            try {
                const supabase = await this.getClient();
                let query = supabase.from(this.tableName).select('*');

                Object.entries(filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });

                const { data, error } = await query;

                if (error || !data) return [];

                return data
                    .map(row => this.mapper.toDomain(row as Row))
                    .filter(res => res.isSuccess())
                    .map(res => res.getValue());
            } finally {
                span.end();
            }
        });
    }

    async delete(id: string): Promise<Result<void, AppError>> {
        return await this.tracer.startActiveSpan(`${this.tableName}.delete`, async (span) => {
            try {
                const supabase = await this.getClient();
                const { error } = await supabase
                    .from(this.tableName)
                    .delete()
                    .eq('id', id);

                if (error) {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                    return fail(AppError.from(error));
                }

                return ok(undefined);
            } catch (error) {
                span.recordException(error as Error);
                return fail(AppError.from(error));
            } finally {
                span.end();
            }
        });
    }
}
