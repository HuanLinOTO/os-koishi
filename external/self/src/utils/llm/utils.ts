import * as ollama from "ollama"


export const read_stream = async (stream: any): Promise<string> => {
    var res = ""
    for await (const part of stream) {
        process.stdout.write(part.message.content)
        res += part.message.content
    }
    return res
}