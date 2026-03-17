import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Redis environment variables are missing. Caching will be disabled.')
}

export const redis = new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL || '').replace(/['"]/g, ''),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').replace(/['"]/g, ''),
})

/**
 * Utility to get or set cache
 * @param key Redis key
 * @param fetcher Async function to fetch data if cache miss
 * @param ttl Time to live in seconds (default 5 minutes)
 */
export async function getOrSetCache<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300): Promise<T> {
    if (!process.env.UPSTASH_REDIS_REST_URL) return fetcher()

    try {
        const cached = await redis.get<T>(key)
        if (cached) {
            console.log(`[Cache Hit] Key: ${key}`)
            return cached as T
        }

        console.log(`[Cache Miss] Key: ${key}. Fetching fresh data...`)
        const freshData = await fetcher()
        await redis.set(key, freshData, { ex: ttl })
        return freshData
    } catch (error) {
        console.error(`[Cache Error] Key: ${key}`, error)
        return fetcher()
    }
}
