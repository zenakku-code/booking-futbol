import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client/web'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
    // Capture and clean environment variables
    const rawUrl = process.env.DATABASE_URL
    const rawToken = process.env.TURSO_AUTH_TOKEN

    const dbUrl = typeof rawUrl === 'string' ? rawUrl.trim() : ''
    const authToken = typeof rawToken === 'string' ? rawToken.trim() : ''

    // Safety check: Avoid "undefined" string or missing URL
    const isValidTursoUrl = dbUrl.length > 0 && dbUrl !== 'undefined' && (dbUrl.startsWith('libsql:') || dbUrl.includes('turso.io'))

    if (isValidTursoUrl) {
        console.log(`[Prisma] Initializing Turso Adapter (URL starts with: ${dbUrl.substring(0, 10)})`)
        try {
            const libsql = createClient({
                url: dbUrl,
                authToken: authToken,
            })
            const adapter = new PrismaLibSQL(libsql as any)
            return new PrismaClient({ adapter })
        } catch (e) {
            console.error('[Prisma] Fatal Turso Initialization Error:', e)
            // If it fails, we fall back to local to avoid total crash, 
            // but log it prominently
        }
    }

    console.log('[Prisma] Initializing with default local SQLite provider...')
    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
