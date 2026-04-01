// src/core/application/services/ConfidenceService.ts

export type ConfidenceThreshold = {
    minFullAuto: number; // Above this, it's 100% automated
    minSuggest: number;  // Below minFullAuto but above this, it's a suggestion (REQUIRES REVIEW)
    // Below minSuggest, it's rejected/failed
};

export class ConfidenceService {
    private readonly thresholds: Record<string, ConfidenceThreshold> = {
        'NEGOTIATOR': { minFullAuto: 0.85, minSuggest: 0.5 },
        'QA_REVIEW': { minFullAuto: 0.9, minSuggest: 0.7 },
        'DEFAULT': { minFullAuto: 0.8, minSuggest: 0.4 }
    };

    /**
     * Determines the final autonomy level based on agent confidence.
     */
    getAutonomyRecommendation(context: string, confidence: number): 'full_auto' | 'suggest' | 'human_only' {
        const threshold = this.thresholds[context] || this.thresholds['DEFAULT']!;

        if (confidence >= threshold.minFullAuto) {
            return 'full_auto';
        }

        if (confidence >= threshold.minSuggest) {
            return 'suggest';
        }

        return 'human_only';
    }

    /**
     * Checks if a decision is safe to propagate without human intervention.
     */
    isSafe(context: string, confidence: number): boolean {
        return this.getAutonomyRecommendation(context, confidence) === 'full_auto';
    }
}
