import { type Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import {
  AIAuditPort,
  AIAuditEntry,
  AIAuditRecord,
  AIAuditQuery,
  AIAuditStats,
} from '@/core/application/ports/AIAuditPort';
import { createApiClient } from '@/lib/supabase/api';

export class SupabaseAIAuditAdapter implements AIAuditPort {
  constructor() {}

  async log(entry: AIAuditEntry): Promise<Result<string, AppError>> {
    const apiRes = await createApiClient();
    if (apiRes.kind === 'failure') return fail(apiRes.getError());
    const supabase = apiRes.getValue();

    const { data, error } = await supabase
      .from('ai_audit_log')
      .insert({
        agent_name: entry.agentName,
        agent_version: entry.agentVersion ?? '1.0.0',
        action: entry.action,
        decision: entry.decision,
        autonomy_level: entry.autonomyLevel,
        confidence: entry.confidence,
        reasoning: entry.reasoning ?? null,
        aggregate_type: entry.aggregateType,
        aggregate_id: entry.aggregateId,
        amount_involved: entry.amountInvolved ?? null,
        currency: entry.currency ?? 'CLP',
        model_used: entry.modelUsed ?? null,
        input_tokens: entry.inputTokens ?? null,
        output_tokens: entry.outputTokens ?? null,
        latency_ms: entry.latencyMs ?? null,
        cost_usd: entry.costUsd ?? null,
        metadata: entry.metadata ?? {},
      })
      .select('id')
      .single();

    if (error || !data) {
      return fail(
        AppError.internal(
          `Failed to log AI audit: ${error?.message ?? 'Unknown'}`,
        ),
      );
    }

    return ok(data.id);
  }

  async findByAggregate(
    aggregateType: string,
    aggregateId: string,
  ): Promise<Result<AIAuditRecord[], AppError>> {
    const apiRes = await createApiClient();
    if (apiRes.kind === 'failure') return fail(apiRes.getError());
    const supabase = apiRes.getValue();

    const { data, error } = await supabase
      .from('ai_audit_log')
      .select('*')
      .eq('aggregate_type', aggregateType)
      .eq('aggregate_id', aggregateId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return fail(
        AppError.internal(`Failed to query audit log: ${error.message}`),
      );
    }

    return ok((data ?? []).map(this.mapToRecord));
  }

  async findUnreviewed(
    limit: number = 20,
  ): Promise<Result<AIAuditRecord[], AppError>> {
    const apiRes = await createApiClient();
    if (apiRes.kind === 'failure') return fail(apiRes.getError());
    const supabase = apiRes.getValue();

    const { data, error } = await supabase
      .from('ai_audit_log')
      .select('*')
      .eq('human_reviewed', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return fail(
        AppError.internal(`Failed to query unreviewed: ${error.message}`),
      );
    }

    return ok((data ?? []).map(this.mapToRecord));
  }

  async markReviewed(
    auditId: string,
    reviewedBy: string,
    humanDecision: 'confirmed' | 'overridden',
    notes?: string,
  ): Promise<Result<void, AppError>> {
    const apiRes = await createApiClient();
    if (apiRes.kind === 'failure') return fail(apiRes.getError());
    const supabase = apiRes.getValue();

    const { error } = await supabase
      .from('ai_audit_log')
      .update({
        human_reviewed: true,
        human_decision: humanDecision,
        human_notes: notes ?? null,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', auditId);

    if (error) {
      return fail(
        AppError.internal(`Failed to mark reviewed: ${error.message}`),
      );
    }

    return ok(undefined);
  }

  async query(
    params: AIAuditQuery,
  ): Promise<Result<AIAuditRecord[], AppError>> {
    const apiRes = await createApiClient();
    if (apiRes.kind === 'failure') return fail(apiRes.getError());
    const supabase = apiRes.getValue();

    let q = supabase
      .from('ai_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 50);

    if (params.offset) q = q.range(params.offset, params.offset + (params.limit ?? 50) - 1);
    if (params.agentName) q = q.eq('agent_name', params.agentName);
    if (params.aggregateType) q = q.eq('aggregate_type', params.aggregateType);
    if (params.aggregateId) q = q.eq('aggregate_id', params.aggregateId);
    if (params.decision) q = q.eq('decision', params.decision);
    if (params.fromDate) q = q.gte('created_at', params.fromDate.toISOString());
    if (params.toDate) q = q.lte('created_at', params.toDate.toISOString());
    if (params.unreviewedOnly) q = q.eq('human_reviewed', false);

    const { data, error } = await q;

    if (error) {
      return fail(
        AppError.internal(`Failed to query audit: ${error.message}`),
      );
    }

    return ok((data ?? []).map((row: any) => this.mapToRecord(row)));
  }

  async getStats(
    fromDate?: Date,
    toDate?: Date,
  ): Promise<Result<AIAuditStats, AppError>> {
    const apiRes = await createApiClient();
    if (apiRes.kind === 'failure') return fail(apiRes.getError());
    const supabase = apiRes.getValue();

    const { data, error } = await supabase.rpc('get_ai_audit_stats', {
      p_from_date: fromDate?.toISOString() ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      p_to_date: toDate?.toISOString() ?? new Date().toISOString(),
    });

    if (error) {
      return fail(
        AppError.internal(`Failed to get stats: ${error.message}`),
      );
    }

    return ok({
      totalDecisions: data?.totalDecisions ?? 0,
      autoApproved: data?.autoApproved ?? 0,
      escalated: data?.escalated ?? 0,
      humanOverridden: data?.humanOverridden ?? 0,
      averageConfidence: data?.averageConfidence ?? 0,
      totalCostUsd: data?.totalCostUsd ?? 0,
    });
  }

  private mapToRecord(row: any): AIAuditRecord {
    return {
      id: String(row.id),
      agentName: String(row.agent_name),
      agentVersion: row.agent_version ? String(row.agent_version) : undefined,
      action: String(row.action),
      decision: row.decision as AIAuditRecord['decision'],
      autonomyLevel: row.autonomy_level as AIAuditRecord['autonomyLevel'],
      confidence: Number(row.confidence),
      reasoning: row.reasoning ? String(row.reasoning) : undefined,
      aggregateType: String(row.aggregate_type),
      aggregateId: String(row.aggregate_id),
      amountInvolved: row.amount_involved ? Number(row.amount_involved) : undefined,
      currency: row.currency ? String(row.currency) : undefined,
      modelUsed: row.model_used ? String(row.model_used) : undefined,
      inputTokens: row.input_tokens ? Number(row.input_tokens) : undefined,
      outputTokens: row.output_tokens ? Number(row.output_tokens) : undefined,
      latencyMs: row.latency_ms ? Number(row.latency_ms) : undefined,
      costUsd: row.cost_usd ? Number(row.cost_usd) : undefined,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      humanReviewed: Boolean(row.human_reviewed),
      humanDecision: row.human_decision as AIAuditRecord['humanDecision'],
      reviewedBy: row.reviewed_by ? String(row.reviewed_by) : undefined,
      reviewedAt: row.reviewed_at ? new Date(String(row.reviewed_at)) : undefined,
      createdAt: new Date(String(row.created_at)),
    };
  }
}
