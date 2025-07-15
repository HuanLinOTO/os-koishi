import { Logger } from 'koishi';
import { DocumentService } from '../document/service';

const docService = new DocumentService();

const logger = new Logger("self.docs")

export const query_docs = async (categories: string[]) => {
    const res = []
    logger.info(`query_docs: ${categories}`)
    for (const category of categories) {
        const result = await docService.getDocumentsByCategory(category, 3);
        const tmp = result.documents.map((doc, index) => ({
            id: result.ids[index],
            content: result.documents[index],
            ...result.metadatas[index]
        }));
        res.push(...tmp)
    }
    return res
};