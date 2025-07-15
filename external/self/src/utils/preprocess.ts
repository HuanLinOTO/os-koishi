import { Logger } from "koishi"
import ollama from "ollama"

const logger = new Logger("self.preprocess")

const gossip_prompt = `
你将会收到一条消息，请你判断用户是在提问，还是在闲聊，你需要将结果包含在<OUTPUT></OUTPUT>内，1表示提问，0表示闲聊，你只需要判断，不需要给出任何回答
例如：
 - 你是谁啊？ -> <OUTPUT>0</OUTPUT>
 - 今天天气真好 -> <OUTPUT>0</OUTPUT>
 - 你知道怎么安装Python吗？ -> <OUTPUT>1</OUTPUT>
 - 爆显存了怎么办 -> <OUTPUT>1</OUTPUT>
`

export const is_gossip = async (message: string) => {
    // const response = await ollama.chat({
    //     model: "gemma2:9b-instruct-q8_0",
    //     messages: [
    //         {
    //             role: "system",
    //             content: gossip_prompt
    //         },
    //         {
    //             role: "user",
    //             content: message
    //         }
    //     ]
    // })
    // var content = response.message.content
    // logger.info("is_gossip response: ", content)
    // // 取出<OUTPUT></OUTPUT>中的内容
    // var result = content.match(/<OUTPUT>(.*?)<\/OUTPUT>/)
    // if (result) {
    //     return result[1] == "0"
    // } else {
    //     return false
    // }
    return false
}