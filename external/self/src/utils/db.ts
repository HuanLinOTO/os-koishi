import { Context, Database, Session, Element } from "koishi";

export type DB = Database<Tables>

export interface DBMessages {
    id?: number;
    platform: string;
    username: string;
    channel_id: string;
    content: string;
    use_bot: boolean;
}

export interface DBDocs {
    id?: number;
    category_id?: number;
    series?: string;
    enabled?: boolean;
    content?: string;
}

export interface DBDocsCategory {
    id?: number;
    category: string;
    enabled: boolean;
}

interface Tables {
    "self.messages": DBMessages
    "self.docs": DBDocs
    "self.docs_category": DBDocsCategory
}

export const apply_db = async (database: DB) => {
    database.extend('self.messages', {
        id: 'integer',
        platform: 'string',
        channel_id: 'string',
        content: 'string',
        username: 'string',
        use_bot: 'boolean'
    }, {
        primary: 'id',
        autoInc: true,
    })

    database.extend('self.docs', {
        id: 'integer',
        category_id: 'integer',
        content: 'string',
        enabled: 'boolean',
        series: 'string'
    }, {
        primary: 'id',
        autoInc: true,
    })

    database.extend('self.docs_category', {
        id: 'integer',
        category: 'string',
        enabled: 'boolean'
    }, {
        primary: 'id',
        autoInc: true,
    })
}

export const drop_message = async (database: DB) => database.drop("self.messages")

export const save_message = async (database: DB, data: DBMessages) => {
    return await database.create("self.messages", data)
}

export const get_message_by_platform_guildid_channelid = async (database: DB, limit: number, platform: string, channel_id: string) => {
    return await database.select("self.messages").where({
        platform,
        channel_id
    }).orderBy("id", "desc").limit(limit).execute()
}

export * from "./document/functions"

// export const add_category = async (database: DB, category: string) => {
//     return await database.create("self.docs_category", {
//         category,
//         enabled: true
//     })
// }

// export const get_category_list = async (database: DB) => {
//     return await database.get("self.docs_category", {})
// }

// export const get_docs_by_category_id = async (database: DB, category_id: number) => {
//     return await database.get("self.docs", {
//         category_id,
//         enabled: true
//     })
// }

// export const add_docs = async (database: DB, data: DBDocs) => {
//     return await database.create("self.docs", data)
// }

// export const update_docs = async (database: DB, id: number, data: DBDocs) => {
//     return await database.set("self.docs", { id }, data)
// }