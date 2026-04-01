import { z } from 'zod';

/**
 * ConfidenceFramework — AI Decision Governance
 *
 * Controls when AI agents act autonomously vs. escalate to humans.
 * Each agent has a configurable threshold that determines behavior:
 *
 * - Score ≥ autoApproveThreshold → Autonomous action
 * - Score ≥ suggestThreshold     → Suggestion with human approval required
 * - Score < suggestThreshold     → Mandatory escalation to human
 *
 * @module core/ai/confidence/ConfidenceFramework
 */

// ─── Agent Identifiers ─────────────────────────────────────────

export const AI_AGENT_NAMES = ['BROKER', 'NEGOTIATOR', 'QA_SENTINEL'] as const;
export type AIAgentName = (typeof AI_AGENT_NAMES)[number];

// ─── Confidence Output Schema ──────────────────────────────────

export const ConfidenceDecisionSchema = z.object({
    action: z.enum(['AUTO_APPROVE', 'SUGGEST', 'ESCALATE']),
    score: z.number().min(0).max(100),
    agentName: z.string(),
    reasoning: z.string(),
});

export type ConfidenceDecision = z.infer<typeof ConfidenceDecisionSchema>;

// ─── Threshold Configuration ───────────────────────────────────

interface AgentThresholdConfig {
    /** Score >= this → autonomous action (no human needed) */
    autoApproveThreshold: number;
    /** Score >= this (but < autoApprove) → suggestion for human review */
    suggestThreshold: number;
    /** Max retries before escalation on AI failure */
    maxRetries: number;
    /** Description for audit logs */
    description: string;
}

/**
 * Per-agent threshold configuration.
 * These values were calibrated based on the risk profile of each agent:
 *
 * - BROKER: High threshold (88) because assignment affects money flow
 * - NEGOTIATOR: Highest threshold (90) because it directly influences pricing
 * - QA_SENTINEL: Lower threshold (85) because it's advisory (admin still reviews)
 */
const AGENT_THRESHOLDS: Record<AIAgentName, AgentThresholdConfig> = {
    BROKER: {
        autoApproveThreshold: 88,
        suggestThreshold: 60,
        maxRetries: 2,
        description: 'Provider-Quotation matching agent',
    },
    NEGOTIATOR: {
        autoApproveThreshold: 90,
        suggestThreshold: 65,
        maxRetries: 1,
        description: 'Price negotiation strategy agent',
    },
    QA_SENTINEL: {
        autoApproveThreshold: 85,
        suggestThreshold: 55,
        maxRetries: 2,
        description: 'Quality assurance review agent',
    },
};

// ─── Core Decision Function ────────────────────────────────────

/**
 * Evaluates a confidence score against an agent's thresholds
 * and returns the appropriate action.
 *
 * @param agentName - Which AI agent produced the score
 * @param score - Confidence score (0-100)
 * @param reasoning - Human-readable reasoning from the agent
 * @returns ConfidenceDecision with the action to take
 *
 * @example
 * ```typescript
 * const decision = evaluateConfidence('BROKER', 92, 'Perfect skill match');
 * // { action: 'AUTO_APPROVE', score: 92, agentName: 'BROKER', reasoning: '...' }
 *
 * const decision2 = evaluateConfidence('NEGOTIATOR', 70, 'Moderate deviation');
 * // { action: 'SUGGEST', score: 70, agentName: 'NEGOTIATOR', reasoning: '...' }
 * ```
 */
export function evaluateConfidence(
    agentName: AIAgentName,
    score: number,
    reasoning: string,
    dynamicThresholds?: AgentThresholdConfig // [NUEVO] Inyectar config remota opcional
): ConfidenceDecision {
    const config = dynamicThresholds ?? AGENT_THRESHOLDS[agentName];

    if (score >= config.autoApproveThreshold) {
        return {
            action: 'AUTO_APPROVE',
            score,
            agentName,
            reasoning: `[AUTO] ${reasoning}`,
        };
    }

    if (score >= config.suggestThreshold) {
        return {
            action: 'SUGGEST',
            score,
            agentName,
            reasoning: `[SUGGEST] ${reasoning} — Requires human approval.`,
        };
    }

    return {
        action: 'ESCALATE',
        score,
        agentName,
        reasoning: `[ESCALATE] ${reasoning} — Below minimum confidence. Human intervention required.`,
    };
}

// ─── Utilities ─────────────────────────────────────────────────

/**
 * Returns the threshold config for a specific agent.
 * Useful for UI display (e.g., showing thresholds in admin dashboard).
 */
export function getAgentConfig(agentName: AIAgentName): Readonly<AgentThresholdConfig> {
    return AGENT_THRESHOLDS[agentName];
}

/**
 * Returns all agent configurations (for admin settings panel).
 */
export function getAllAgentConfigs(): Readonly<Record<AIAgentName, AgentThresholdConfig>> {
    return AGENT_THRESHOLDS;
}
