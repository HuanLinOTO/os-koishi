import { DocumentStore } from './store';
const { v4: uuidv4 } = require('uuid');

export class DocumentService {
    private store: DocumentStore;

    constructor() {
        this.store = new DocumentStore();
    }

    async addCategory(category: string): Promise<void> {
        await this.store.addCategory(category);
    }

    async getCategories(): Promise<string[]> {
        return await this.store.getCategories();
    }

    async removeCategory(category: string): Promise<void> {
        await this.store.removeCategory(category);
    }

    async addDocument(category: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
        const id = uuidv4();
        await this.store.addDocument(category, {
            id,
            content,
            metadata: {
                ...metadata,
                created_at: new Date().toISOString(),
                enabled: true
            }
        });
    }

    async getDocumentsByCategory(category: string, limit?: number): Promise<{
        ids: string[];
        documents: string[];
        metadatas: Record<string, any>[];
    }> {
        return await this.store.getDocuments(category, limit);
    }

    async updateDocument(
        category: string,
        id: string,
        content: string,
        metadata: Record<string, any> = {}
    ): Promise<void> {
        await this.store.updateDocument(category, id, content, {
            ...metadata,
            updated_at: new Date().toISOString()
        });
    }

    async removeDocument(category: string, id: string): Promise<void> {
        await this.store.removeDocument(category, id);
    }

    async rebuildEmbeddings(category: string): Promise<void> {
        await this.store.rebuildEmbeddings(category);
    }
}