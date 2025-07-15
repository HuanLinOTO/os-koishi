// 你需要将用户提供的文档分割成语义完整的QA对，每一个对分割到<OUT><OUT/>标签中，明白了就说好的
import { Logger } from "koishi"
import ollama from "ollama"
import { model } from "./config"
import { read_stream } from "./utils"

const system_prompt = `
你需要将用户提供的文档分割成语义完整的QA对，每一个对分割到<OUT>标签中
如果用户提供的文档没有明显的QA，你可以根据文档内容编造Q，并给出对应的A，必须要注意的是，Q必须是和文档内容完全相关的问题
分离的QA对需要尽可能得多，以保证覆盖完全

例如：
<OUT>
Q: 你是谁啊？
A: 我是机器人
</OUT>
`

const logger = new Logger("self.split_docs")
const generateRandomQA = () => {
    const questions = [
        "你是谁啊？",
        "你做什么工作？",
        "你喜欢什么？",
        "你从哪里来？",
        "你的爱好是什么？"
    ]
    const answers = [
        "我是机器人",
        "我是一个程序员",
        "我喜欢编程",
        "我来自互联网",
        "我的爱好是学习新知识"
    ]

    const result = []
    for (let i = 0; i < questions.length; i++) {
        result.push(`\nQ: ${questions[i]}\nA: ${answers[i]}\n`)
    }
    return result
}

export const split_docs = async (message: string) => {
    // return generateRandomQA()
    const response = await ollama.chat({
        model,
        messages: [
            {
                role: "system",
                content: system_prompt
            },
            {
                role: "user",
                content: message
            }
        ],
        options: {
            "num_ctx": 25565
        },
        stream: true
    })
    var content = await read_stream(response)
    logger.info("split_docs response: ", content)
    // 取出<OUT></OUT>中的内容
    const result = []
    for (const match of content.matchAll(/<OUT>([\s\S]*?)<\/OUT>/g)) {
        result.push(match[1])
    }
    return result


}