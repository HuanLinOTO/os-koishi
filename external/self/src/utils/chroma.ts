import * as chromadb from 'chromadb'
let chroma_client: chromadb.ChromaClient

export const use_client = () => {
    if (!chroma_client) {
        chroma_client = new chromadb.ChromaClient({
            path: "http://127.0.0.1:8000"
        });
    }
    return chroma_client
}