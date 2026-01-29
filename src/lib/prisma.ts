import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const isTurso = process.env.DATABASE_URL?.startsWith('libsql:') || process.env.DATABASE_URL?.includes('turso.io')

const createPrismaClient = () => {
    // Only use LibSQL adapter if we have a valid Turso URL
    if (isTurso && process.env.DATABASE_URL) {
        try {
            const libsql = createClient({
                url: process.env.DATABASE_URL as string,
                authToken: process.env.TURSO_AUTH_TOKEN,
            })
            const adapter = new PrismaLibSql(libsql as any)
            return new PrismaClient({ adapter })
        } catch (e) {
            console.warn('Failed to initialize LibSQL adapter, falling back to default Prisma client:', e)
        }
    }
    return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
