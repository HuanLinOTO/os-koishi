import { log } from 'console';
import { DocumentService } from './service';

const docService = new DocumentService();

export const add_category = async (category: string) => {
    await docService.addCategory(category);
};

export const remove_category = async (category: string) => {
    await docService.removeCategory(category);
}

export const get_category_list = async () => {
    const tmp = await docService.getCategories();
    return tmp
        // .filter((item) => item.startsWith("docs-"))
        .map((category, index) => ({
            id: index,
            category,
            enabled: true
        }));
};

export const get_docs_by_category = async (category: string, limit?: number) => {
    const result = await docService.getDocumentsByCategory(category, limit);
    const tmp = result.documents.map((doc, index) => ({
        id: result.ids[index],
        content: result.documents[index],
        ...result.metadatas[index]
    }));
    return tmp
};

export const add_docs = async (category: string, content: string, metadata: Record<string, any> = {}) => {
    await docService.addDocument(category, content, metadata);
};

export const update_docs = async (category: string, id: string, content: string, metadata: Record<string, any> = {}) => {
    await docService.updateDocument(category, id, content, metadata);
};

export const remove_docs = async (category: string, id: string) => {
    await docService.removeDocument(category, id);
}

export const rebuild_embeddings = async (category: string) => {
    await docService.rebuildEmbeddings(category);
}