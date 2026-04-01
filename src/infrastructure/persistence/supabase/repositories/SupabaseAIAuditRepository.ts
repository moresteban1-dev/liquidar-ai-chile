import { SupabaseClient } from '@supabase/supabase-js';

export interface AIAuditRepository {
    logInference(data: any): Promise<void>;
}

export class SupabaseAIAuditRepository implements AIAuditRepository {
    constructor(private readonly supabase: SupabaseClient) {}

    async logInference(data: any): Promise<void> {
        const { error } = await this.supabase
            .from('ai_audits')
            .insert({
                data,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error logging AI audit:', error);
        }
    }
}
