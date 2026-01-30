import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
    const url = process.env.DATABASE_URL
    const token = process.env.TURSO_AUTH_TOKEN

    let prisma;

    if (url && token && (url.startsWith('libsql://') || url.includes('turso.io'))) {
        console.log('Connecting to Turso...')
        const adapter = new PrismaLibSQL({
            url: url,
            authToken: token,
        })
        prisma = new PrismaClient({ adapter })
    } else {
        console.log('Falling back to local SQLite...')
        prisma = new PrismaClient()
    }

    try {
        const fields = await prisma.field.findMany({
            include: { complex: true }
        })
        console.log('FIELDS:', JSON.stringify(fields, null, 2))

        const complexes = await prisma.complex.findMany()
        console.log('COMPLEXES:', JSON.stringify(complexes, null, 2))
    } finally {
        await prisma.$disconnect()
    }
}

main().catch(console.error)
