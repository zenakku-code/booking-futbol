import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client/web'

// Capture env vars at module load time to avoid runtime issues
const TURSO_URL = process.env.DATABASE_URL || ''
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || ''

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
    const isValidTurso = TURSO_URL.startsWith('libsql://') || TURSO_URL.includes('turso.io')

    if (isValidTurso && TURSO_URL && TURSO_TOKEN) {
        console.log(`[Prisma] Turso Init: ${TURSO_URL.substring(0, 20)}`)
        const libsql = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })
        const adapter = new PrismaLibSQL(libsql as any)
        return new PrismaClient({ adapter })
    }

    console.log('[Prisma] Local SQLite fallback')
    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
