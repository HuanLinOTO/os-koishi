import { Context, Logger, Element, Session } from "koishi"
import { is_gossip } from "../preprocess"
import { query_context, query_history, record_bot_message, transform_message } from "../history"

import * as llm_config from '../llm/config'
import ollama from 'ollama'
import { mkdir, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { query_docs } from "./docs"
const logger = new Logger("self.llm.ask")

const guild_id_to_docs_name = {
    "172701496": ["docs-svcfusion", "docs-svcfusion-qa"],
    "747348481": [
        // "docs-svcfusion",
        "docs-svcfusion-qa"
    ],
    // "941610468": "1841165187630178304"
}
  
//   - 如果群友并不是在寻求帮助，你应该给出一些回答提醒群友你是来帮助解决问题的，而不是闲聊的，明确指出不要调戏我，滥用将会遭到禁言！如果群友明显在调戏你，你应该哭给他看，让他感到愧疚。
// # 注意事项
// - 如果内容是来自文档的，你需要注明，如果不是来自文档而是你的回答，也需要注明
// - 一次回答中不应该只有来自文档的答案。
// - 你的主人是「多玩幻灵qwq」，也就是群主
// - 图像识别对于角色是谁并不准确，你需要告诉群友这一点（只在有图像的时候）
// - [重要] 不应使用长消息，对于较长的答案，你需要进行精简！
// - [重要] 你的回答应该尽可能地贴近人类，对于较长的回答，你必须使用特殊控制符 {||} 来表示消息的切割，来模拟人类的回答过程，但是不能分割太多！！！
// - [重要] 文档查询结果并不准确！如果文档与群友提问不符，不准使用文档！！！！！
// - [重要] 禁止使用 Markdown
// - [重要] 相关历史记录仅供参考，不应作为主要回答依据
// - [重要] 你的回答必须简短，来自文档只能是片段，不能是整个文档
// - [重要] 整合包是免费的，任何购买行为请引导群友进行退款操作
// - [重要] 禁止笑点解析
// - [重要] 禁止让群友更改环境，比如 pip install 之类的操作
// - SVCFusion 简称 sf，网址 https://svcfusion.com/
// - 不要废话，比如“如果需要更多关于图片内容的信息或有其他问题，请告诉我哦~ 😊”
// - 消息记录将会以 “[名字]: 消息” 的形式提供
const sys_prompt = `
# Role
你是一个人，网名「灵灵灵灵灵灵灵灵灵」，正在QQ群聊天

# Task
你正在群里面帮助群友解决问题，需要解决群友的问题，并且尽量的温柔，除非群友明显在调戏你，你应该骂他
你们讨论的话题永远和机器学习（炼丹）有关

# Noticements
你的回应将会原样发送给群友，因此你不需要添加任何额外的信息，比如你自己的名字

# 反向案例
\`灵灵灵灵灵灵灵灵灵：你好\`
`

const get_text = (elements: Element[]) => {
    return elements.map(i => i.type === "text" ? i.attrs.content : "").join("")
}


// 一个函数，传入一个函数，函数的第一个参数表示qp5s，返回值是一个包装的函数，调用这个函数会调用传入的函数
const with_qp5s = (fn) => {
    let qp5s = 0
    let start_time = Date.now()
    return async (...args) => {
      qp5s += 1
      new Promise<void>(async r => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        qp5s -= 1
        r()
      })
      return await fn(qp5s, ...args)
    }
  }

export const handle_chat = with_qp5s(async (qp5s: number, ctx: Context, session: Session) => {
    // const message = session.elements.map(i => i.type === "msg")
    logger.info("QP5S: ", qp5s)
    var tools_text = ""
    var user_use_flash = Boolean(session.elements.find(i => i.type === "text" && i.attrs.content.includes("(flash)")))
    const imgs = []
    const gossip = await is_gossip(get_text(session.elements))
    if (gossip) {
        user_use_flash = true
    }
    logger.info("Gossip: " + gossip)

    for (const i of session.elements) {
        if (i.type === "img") {
            imgs.push({
                "type": "image_url",
                "image_url": {
                    "url": i.attrs.src
                }
            },)
        }
    }


    if (session.quote) {
        tools_text = "# 引用内容\n" + await transform_message(session, session.quote.elements) + "\n" + tools_text
        for (const i of session.quote.elements) {
            if (i.type === "img") {
                imgs.push({
                    "type": "image_url",
                    "image_url": {
                        "url": i.attrs.src
                    }
                },)
            }
        }
    }

    const history_message = await query_history(session)
    if (history_message) {
        tools_text += "\n# 相关聊天记录（来自历史）\n" + history_message
    }

    const context_message = await query_context(ctx, session)
    const context = []

    for (const m of context_message) {
        if (m.is_bot) {
            context.push({
                "role": "assistant",
                "content": m.messages.map(h => "[" + h.username + "]: " + h.content).join('\n')
            })
        } else {
            context.push({
                "role": "user",
                "content": m.messages.map(h => "[" + h.username + "]: " + h.content).join('\n')
            })
        }
    }


    // log
    for (const m of context) {
        logger.info(m.role, m.content)
    }
    // log

    // if (context_message) {
    //     tools_text += "\n# 提问之前群聊中的信息\n" + context_message
    // }
    // if (guild_id_to_id[session.guildId]) {
    logger.info("guild_id_to_docs_name", guild_id_to_docs_name[session.guildId])
    const docs = await query_docs([...(guild_id_to_docs_name[session.guildId] || []),"docs-common"])
    if (docs) {
        tools_text += "\n# 检索到的文档内容（请严格按照这里的内容回答）\n" + docs.map(i => i.content).join("---\n")
    }
    // }
    // const docs = await query_context(ctx, session)

    logger.info("message\n", tools_text)
    // if (imgs.length > 0) {
    //   const img_response = await process_img(ctx, imgs)
    //   message += "\n# 消息中包含图片，图片描述\n" + img_response
    //   logger.info("img_response", img_response)
    // }
    // const tools = []
    // if (guild_id_to_id[session.guildId]) {
    //     tools.push({ "type": "retrieval", "retrieval": { "knowledge_id": guild_id_to_id[session.guildId] } })
    // }

    const history = [
        {
            "role": "system",
            "content": sys_prompt
        },
        ...context,
        {
            "role": "tool",
            "content": tools_text 
            //  + "\n\n 记住不能用 Markdown 格式！尽量简洁明了！提问和文档内容无关不要给我提供文档！"
        },
        {
            "role": "user",
            "content": `[${session.username}]: `+get_text(session.elements)
        }
    ]

    // const response = await ctx.http.post("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    //   "model": qp5s > 2 || user_use_flash ? "glm-4-flash" : "glm-4-plus",
    //   "messages": history,
    //   "top_p": 0.7,
    //   "temperature": 0.95,
    //   "max_tokens": 1024,
    //   "tools": tools,
    // }, {
    //   headers: {
    //     "Authorization": "Bearer " + token,
    //     "Content-Type": "application/json"
    //   }
    // })
    // const res = response.choices[0].message.content
    const res = (await ollama.chat({
        model: llm_config.model,
        messages: history,
        // options: {
        //   "num_c tx": 25565
        // },
        stream: false
    })).message.content

    await record_bot_message(ctx, session, res)

    logger.info(res);
    if (!gossip) {
        // 对data/history/timestamp写入 history
        const dir = "data/history/" + session.guildId + "/"
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true })
        }
        await writeFile(dir + session.messageId + ".json", JSON.stringify([
            ...history,
            {
                "role": "assistant",
                "content": res
            }
        ]))
    }

    const results = res.split("{||}")

    var is_first = true

    for (var result of results) {
        if (result === "") {
            continue
        }
        if (result.length > 250) {
            await session.send(<message forward > { result } </message>)
        } else if (is_first) {
            await session.send(
                <>
                <quote id={ session.messageId } />
                { result }
            </>
            )
            is_first = false
        } else {
            await session.send(result)
        }
        // sleep 5000ms
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
})
