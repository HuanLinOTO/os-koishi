import { ChromaClient } from 'chromadb';
import { use_client } from '../chroma';
import ollama from "ollama"
import { Logger } from 'koishi';

export type Collection = Awaited<ReturnType<ChromaClient['createCollection']>>;

const logger = new Logger('self.docs.store');

export class DocumentStore {
    private client: ChromaClient;
    private collections: Map<string, Collection> = new Map();

    constructor() {
        this.client = use_client();
    }

    private async getEmbedding(content: string): Promise<number[]> {
        // return await this.client.getEmbedding(content);
        const res = await ollama.embed({
            input: content,
            model: 'huanlin/chuxin-embedding-q8_0',
        })
        return res.embeddings[0]
    }

    private async getCollection(category: string): Promise<Collection> {
        if (!this.collections.has(category)) {
            const collection = await this.client.getOrCreateCollection({
                name: category,
            });
            this.collections.set(category, collection);
        }
        return this.collections.get(category)!;
    }

    async addCategory(category: string): Promise<void> {
        await this.getCollection(category);
    }

    async removeCategory(category: string): Promise<void> {
        if (this.collections.has(category)) {
            await this.client.deleteCollection({
                name: category
            });
            this.collections.delete(category);
        }
    }

    async getCategories(): Promise<string[]> {
        const collections = await this.client.listCollections();
        return collections.map(collection => collection.name);
    }

    async addDocument(category: string, document: {
        id: string,
        content: string,
        metadata?: Record<string, any>
    }): Promise<void> {
        const collection = await this.getCollection(category);
        await collection.add({
            ids: [document.id],
            documents: [document.content],
            metadatas: [document.metadata || undefined],
            embeddings: [await this.getEmbedding(document.content)]
        });
    }

    async getDocuments(category: string, limit?: number): Promise<{
        ids: string[];
        documents: string[];
        metadatas: Record<string, any>[];
    }> {
        const collection = await this.getCollection(category);

        return await collection.get({
            limit
        });
    }

    async updateDocument(
        category: string,
        id: string,
        content: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        const collection = await this.getCollection(category);
        delete metadata?.created_at;
        delete metadata?.content;
        delete metadata?.id;
        const tmp = await collection.update({
            ids: [id],
            documents: [content],
            metadatas: [metadata || {}],
            embeddings: [await this.getEmbedding(content)]
        });
    }

    async removeDocument(category: string, id: string): Promise<void> {
        const collection = await this.getCollection(category);
        await collection.delete({
            ids: [id]
        });
    }

    async rebuildEmbeddings(category: string): Promise<void> {
        const collection = await this.getCollection(category);
        const { documents, ids } = await collection.get({});
        const embeddings: number[][] = [];
        for (let i = 0; i < documents.length; i++) {
            logger.info(`Processing document ${i + 1} of ${documents.length}`);
            const embedding = await this.getEmbedding(documents[i]);
            embeddings.push(embedding);
        }
        console.log(ids, documents, embeddings);

        await collection.update({
            ids,
            documents,
            embeddings
        });
    }
}