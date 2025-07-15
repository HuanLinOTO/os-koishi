import { Context, Logger, Schema } from 'koishi'
import * as chromadb from 'chromadb'
import { clear_history, record_message } from './utils/history'
import { apply_db } from './utils/db'
import { } from '@koishijs/plugin-console'
import { resolve } from 'path'
import { } from '../shared_types'
import { apply_client_events } from './client/events'
import { handle_chat } from './utils/llm/ask'


export const name = 'self'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export const inject = ['database', "console"]

const token = "7c92f13e86cf8f2924d0e61ae85f96d4.JB2q4Z1gqDqCBi6f"

const chroma_client = new chromadb.ChromaClient({
  path: "http://localhost:5591"
});
const logger = new Logger(name)


export async function apply(ctx: Context) {
  ctx.inject(['console'], (ctx) => {
    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  })

  apply_client_events(ctx)

  await apply_db(ctx.database)
  ctx.middleware(async (session, next) => {
  
    const is_use_bot = Boolean(session.elements.find(i => i.type === "at" && i.attrs.id === session.selfId)) || (session.quote && session.quote.user.id === session.selfId)
    await record_message(ctx, session, is_use_bot)
    // console.log(session.quote.user.id === session.selfId)
    if (is_use_bot || session.isDirect) {
      handle_chat(ctx, session).catch(logger.error)
    }
    next()
  })
  

  ctx.command('clear_history').action(async ({ session }) => {
    await clear_history(session)
    return "Cleared >_<"
  })
  
}
