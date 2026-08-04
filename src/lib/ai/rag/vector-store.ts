import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = process.env.PINECONE_API_KEY
    ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    : null;

export const INDEX_NAME = "liquidar-knowledge";

export const getIndex = () => {
    if (!pinecone) {
        throw new Error("Pinecone client not initialized. Check PINECONE_API_KEY.");
    }
    return pinecone.index(INDEX_NAME);
};
