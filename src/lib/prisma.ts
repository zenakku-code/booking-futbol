import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
    let url = process.env.DATABASE_URL

    // Fallback for build time if URL is missing or literally "undefined"
    if (!url || url === "undefined") {
        url = "file:./dev.db"
    }

    const isTurso = url.startsWith('libsql:') || url.includes('turso.io')

    if (isTurso) {
        console.log(`[Prisma] Initializing Turso with URL: ${url.substring(0, 15)}...`)
        try {
            const libsql = createClient({
                url: url,
                authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
            })
            const adapter = new PrismaLibSQL(libsql as any)
            return new PrismaClient({ adapter })
        } catch (e) {
            console.error('[Prisma] LibSQL adapter instantiation error:', e)
        }
    }

    console.log('[Prisma] Initializing with default provider...')
    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
