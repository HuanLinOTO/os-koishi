import { Logger } from "koishi"

const logger = new Logger("self.retry")

export const with_retry = <T extends (...args: any[]) => any>(fn: T, max_retry: number = 3): (...args: Parameters<T>) => Promise<ReturnType<T>> => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        let retry = 0
        while (true) {
            try {
                return await fn(...args)
            } catch (e) {
                logger.error("Error when retry: ", e)
                if (retry >= max_retry) {
                    throw e
                }
                retry += 1
            }
        }
    }
}