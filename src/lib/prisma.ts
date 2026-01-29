import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
    const url = process.env.DATABASE_URL
    const isTurso = url?.startsWith('libsql:') || url?.includes('turso.io')

    if (isTurso && url) {
        console.log('[Prisma] Initializing with LibSQL adapter...')
        try {
            const libsql = createClient({
                url: url,
                authToken: process.env.TURSO_AUTH_TOKEN,
            })
            const adapter = new PrismaLibSQL(libsql as any)
            return new PrismaClient({ adapter })
        } catch (e) {
            console.error('[Prisma] LibSQL initialization failed:', e)
        }
    }

    console.log('[Prisma] Initializing with default provider...')
    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
