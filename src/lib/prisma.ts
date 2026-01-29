import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
    const url = process.env.DATABASE_URL
    const token = process.env.TURSO_AUTH_TOKEN

    if (url && token && (url.startsWith('libsql://') || url.includes('turso.io'))) {
        console.log(`[Prisma] Turso connection to: ${url}`)
        try {
            const libsql = createClient({
                url: url,
                authToken: token,
            })
            const adapter = new PrismaLibSQL(libsql)
            return new PrismaClient({ adapter })
        } catch (e) {
            console.error('[Prisma] Turso error:', e)
        }
    }

    console.log('[Prisma] Local SQLite')
    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
