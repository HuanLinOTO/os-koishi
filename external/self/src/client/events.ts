import { Context, Logger } from "koishi"
import { add_category, add_docs, get_category_list, get_docs_by_category, rebuild_embeddings, remove_category, remove_docs, update_docs } from "../utils/document/functions"
const logger = new Logger("self.client.events")

export const apply_client_events = (ctx: Context) => {
    ctx.console.addListener('docs/add-category', async (name) => {
        try {
            await add_category(name)
            return true
        } catch (e) {
            console.error(e)
            ctx.logger.error(e)
            return false
        }
    })

    ctx.console.addListener('docs/get-categories', async () => {
        try {
            return await get_category_list()
        } catch (e) {
            console.error(e)
            ctx.logger.error(e)
            return []
        }
    })

    ctx.console.addListener('docs/remove-category', async (category) => {
        try {
            await remove_category(category)
            return true
        } catch (e) {
            console.error(e)
            ctx.logger.error(e)
            return false
        }
    })
    ctx.console.addListener('docs/get-docs', async (category) => {
        try {
            return await get_docs_by_category(category)
        } catch (e) {
            console.error(e)
            ctx.logger.error(e)
            return []
        }
    })

    ctx.console.addListener('docs/add-doc', async (params) => {
        try {
            await add_docs(params.category, params.content, params.metadata)
            return true
        } catch (e) {
            console.error(e)
            ctx.logger.error(e)
            return false
        }
    })

    ctx.console.addListener('docs/update-doc', async (params) => {
        try {
            await update_docs(params.category, params.id, params.content, params.metadata)
            return true
        } catch (e) {
            console.error(e, params)
            ctx.logger.error(e)
            return false
        }
    })

    ctx.console.addListener('docs/remove-doc', async (category, id) => {
        try {
            await remove_docs(category, id)
            return true
        } catch (e) {
            console.error(e)
            ctx.logger.error(e)
            return false
        }
    })

    ctx.console.addListener('docs/rebuild-embeddings', async (category) => {
        try {
            await rebuild_embeddings(category)
            return true
        } catch (e) {
            console.error(e)
            ctx.logger.error(e)
            return false
        }
    })
}