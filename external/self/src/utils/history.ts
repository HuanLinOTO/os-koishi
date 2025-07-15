import { get_docs_by_category, remove_category } from './document/functions';
import { Context, Logger, Session, Element } from "koishi"
import { use_client } from "./chroma"
import ollama from "ollama"
import { add_docs, get_message_by_platform_guildid_channelid, save_message } from "./db"
import { with_retry } from "./retry"

const logger = new Logger("self.history")

const get_save_id = (session: Session) => {
    let res: string
    if (session.isDirect) {
        res = "DIRECT-" + session.platform + ":" + session.userId
    } else {
        res = session.channelId || session.guildId
    }
    return res?.replaceAll("/", "-").replaceAll(":", "-").replaceAll("@", "-").replaceAll("#", "-").replaceAll(" ", "-")
}

// 弃用了！！！！！！
// export const add_to_chroma = with_retry(async (session: Session, id: number) => {
//     const chroma_client = use_client()

//     const message_collection = await chroma_client.getOrCreateCollection({
//         name: "messages-" + get_save_id(session),
//     })
//     const embedding_response = await ollama.embeddings({
//         model: "nomic-embed-text",
//         prompt: session.content,
//     })
//     await message_collection.add({
//         documents: [String(id)],
//         embeddings: [embedding_response.embedding],
//         ids: [session.platform + ":" + session.messageId]
//     })
// })

export const transform_message = async (session: Session, elements: Element[], no_check_quote: boolean = false) => {
    var result = ''
    if (session.quote && !no_check_quote) {
        result += `<quote>${await transform_message(session, session.quote.elements, true)}</quote>`
    }
    for (const e of elements) {
        if (e.type === 'text') {
            result += e.attrs.content;
        } else if (e.type === 'at') {
            const { id } = e.attrs;
            if (session.platform === 'onebot') {
                const user_info = await (session as any).onebot.getGroupMemberInfo(session.guildId, id);
                result += `@${user_info.nickname || user_info.card}`;
            } else {
                result += "@" + id;
            }
        } else {
            result += " <element:" + e.type + "/> "
        }
    }
    return result
}


export const save_to_db = async (ctx: Context, session: Session, is_use_bot: boolean, textified_content: string) => {
    return await save_message(ctx.database, {
        platform: session.platform,
        channel_id: get_save_id(session),
        username: session.username,
        content: textified_content,
        use_bot: is_use_bot
    })
}

export const record_message = async (ctx: Context, session: Session, is_use_bot: boolean) => {
    const textified_content = await transform_message(session, session.elements)
    if (textified_content.length <= 3) return;
    // if 私聊 else 群聊
    if (session.isDirect) {
        const res = await save_to_db(ctx, session, true, textified_content)
    } else {
        const res = await save_to_db(ctx, session, is_use_bot, textified_content)
    }
    await add_docs("messages-" + get_save_id(session), textified_content, {
        platform: session.platform,
        username: session.username,
        use_bot: is_use_bot
    })
}

export const record_bot_message = async (ctx: Context, session: Session, content: string) => {
    content = content.trim()
    await save_to_db(ctx, {
        isDirect: session.isDirect,
        platform: session.platform,
        channelId: session.channelId,
        guildId: session.guildId,
        userId: session.userId,
        username: "You"
    } as any, true, content)
    await add_docs("messages-" + get_save_id(session), content, {
        platform: session.platform,
        username: "You",
        use_bot: false,
        is_bot: true
    })
}

export const clear_history = async (session: Session) => {
    await remove_category("messages-" + get_save_id(session))
    // await message_collection.delete()
}

export const query_history = async (session: Session) => {
    const chroma_client = use_client()
    const message_collection = await chroma_client.getOrCreateCollection({
        name: "messages-" + get_save_id(session),
    })
    const embedding_response = await ollama.embeddings({
        model: "huanlin/chuxin-embedding-q8_0",
        prompt: session.content,
    })
    const results = await message_collection.query({
        queryEmbeddings: [embedding_response.embedding],
        nResults: 3,
    })
    if (results["documents"][0].length === 0) {
        logger.info("[RAG] No results found.");
        return null;
    }
    let data = "";
    for (let i = 0; i < results["documents"][0].length; i++) {
        let text = results["documents"][0][i];
        data += `${i + 1}. ${text}\n`;
    }
    logger.info("[RAG] Query result: \n", data);
    return data;
}

export const history_filter = (history: any[]) => {
    var result = []
    var tmp = []
    history.reverse()
    for (var i = 0; i < history.length; i++) {
        const h = history[i]
        if (h.is_bot) {
            result.push({
                messages: tmp,
                is_bot: false
            })
            result.push({
                messages: [h],
                is_bot: false
            })
            tmp = []
        }
        tmp.push(h)
    }
    // return result.map(h => "[" + h.username + "]: " + h.content).join('\n')
    return result
}

export const query_context = async (ctx: Context, session: Session) => {
    const context = await get_docs_by_category("messages-" + get_save_id(session), 10,)
    const filtered_history = history_filter(context)
    return filtered_history
}