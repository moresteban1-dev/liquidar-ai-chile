import { ai } from '@infrastructure/ai/config';
import { textEmbedding004 } from '@genkit-ai/googleai';
import { getIndex } from './vector-store';

/**
 * Searches the Pinecone knowledge base using Gemini embeddings.
 * @param query User query string
 * @param topK Number of results to return
 */
export const searchKnowledgeBase = async (query: string, topK = 5) => {
    const index = getIndex();

    // Generate embedding for query using Gemini
    // We use the 'embed' helper from the ai instance (or direct embed method)
    const embeddingResponse = await ai.embed({
        embedder: textEmbedding004,
        content: query,
    });

    // The response is an array of embeddings (usually length 1 for single content)
    const queryEmbedding = embeddingResponse[0];

    if (!queryEmbedding?.embedding) {
        return [];
    }

    // Query Pinecone
    const results = await index.query({
        vector: queryEmbedding.embedding,
        topK,
        includeMetadata: true,
    });

    return results.matches.map(match => ({
        score: match.score,
        content: match.metadata?.content,
        source: match.metadata?.source,
    }));
};
