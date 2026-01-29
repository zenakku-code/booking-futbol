import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
    const url = process.env.DATABASE_URL
    const token = process.env.TURSO_AUTH_TOKEN

    console.log('[Prisma] Environment check:', {
        hasUrl: !!url,
        urlType: typeof url,
        urlLength: url?.length || 0,
        urlPrefix: url?.substring(0, 10) || 'none',
        hasToken: !!token,
        tokenLength: token?.length || 0
    })

    if (url && token && (url.startsWith('libsql://') || url.includes('turso.io'))) {
        console.log(`[Prisma] Initializing Turso adapter`)
        try {
            const libsql = createClient({
                url: url,
                authToken: token,
            })
            const adapter = new PrismaLibSQL(libsql as any)
            // CRITICAL: Override datasources to prevent Prisma from using schema URL
            const client = new PrismaClient({
                adapter,
                datasources: {
                    db: {
                        url: url
                    }
                }
            })
            console.log('[Prisma] Turso client created successfully')
            return client
        } catch (e) {
            console.error('[Prisma] Turso initialization failed:', e)
        }
    }

    console.log('[Prisma] Falling back to local SQLite')
    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
