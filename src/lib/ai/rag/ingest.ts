import { ai } from '@infrastructure/ai/config';
import { textEmbedding004 } from '@genkit-ai/googleai';
import { getIndex } from './vector-store';
import { logger } from '@/lib/logger';
import { PineconeRecord } from '@pinecone-database/pinecone';

/**
 * Ingests a list of text documents into the Vector Store
 */
export const ingestDocuments = async (docs: { content: string; source: string }[]) => {
    const index = await getIndex();

    // Create embeddings using Gemini
    const vectors: PineconeRecord[] = await Promise.all(docs.map(async (doc) => {
        // Embed the content
        const embeddingResponse = await ai.embed({
            embedder: textEmbedding004,
            content: doc.content,
        });

        // ai.embed returns a number[] or similar depending on the embedder
        // For textEmbedding004 in Genkit, it returns a number[]
        const values = embeddingResponse as unknown as number[];

        return {
            id: `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            values,
            metadata: {
                content: doc.content,
                source: doc.source,
            },
        } as PineconeRecord;
    }));

    // Upsert to Pinecone
    if (vectors.length > 0) {
        logger.info(`Ingesting ${vectors.length} records into namespace: default`);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await index.upsert(vectors as any);
            logger.info('Ingestion complete');
        } catch (e) {
            logger.error('Ingestion failed:', { error: e });
            throw e;
        }
    } else {
        logger.warn("No documents to ingest.");
    }
};
