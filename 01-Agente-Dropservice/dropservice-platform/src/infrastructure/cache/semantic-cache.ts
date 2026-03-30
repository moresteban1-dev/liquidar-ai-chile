import { pinecone, INDEX_NAME } from '@/lib/ai/rag/vector-store';
import { ai, AI_MODELS } from '@infrastructure/ai/genkit-client';
import { logger } from '@/lib/logger';

export class SemanticCache {
    // Default Similarity threshold (0-1). 0.95 is very high.
    private readonly DEFAULT_THRESHOLD = 0.95;

    private getIndex() {
        if (!pinecone) return null;
        return pinecone.index(INDEX_NAME);
    }

    async get(prompt: string, minScore?: number): Promise<string | null> {
        const index = this.getIndex();
        if (!index || !process.env.PINECONE_API_KEY) return null;

        const threshold = minScore ?? this.DEFAULT_THRESHOLD;

        try {
            // 1. Generate Embedding for the incoming prompt
            const embeddingResponse = await ai.embed({
                embedder: AI_MODELS.embedding,
                content: prompt,
            });
            const vector = embeddingResponse[0].embedding;

            // 2. Query Pinecone
            const queryResponse = await index.query({
                vector: vector,
                topK: 1,
                includeMetadata: true,
                filter: { type: 'cache' } // Only search in cache entries
            });

            const match = queryResponse.matches?.[0];

            // 3. Check Similarity
            if (match && match.score && match.score >= threshold) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const metadata = match.metadata as any;
                logger.info(`[SemanticCache] HIT (Score: ${match.score} >= ${threshold})`);
                return metadata.response;
            }

            logger.info(`[SemanticCache] MISS (Score: ${match?.score || 0} < ${threshold})`);
            return null;
        } catch (error) {
            logger.warn(`[SemanticCache] Error: ${error instanceof Error ? error.message : 'Unknown'}`);
            return null; // Fail safe, treat as miss
        }
    }

    async set(prompt: string, response: string): Promise<void> {
        const index = this.getIndex();
        if (!index || !process.env.PINECONE_API_KEY) return;

        try {
            // 1. Generate Embedding
            const embeddingResponse = await ai.embed({
                embedder: AI_MODELS.embedding,
                content: prompt,
            });
            const vector = embeddingResponse[0].embedding;

            // 2. Upsert to Pinecone

            const id = `cache-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

            await index.upsert([{
                id,
                values: vector,
                metadata: {
                    type: 'cache',
                    response,
                    originalPrompt: prompt,
                    timestamp: Date.now()
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }] as any);
        } catch (error) {
            logger.warn(`[SemanticCache] Set Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
}

export const semanticCache = new SemanticCache();
