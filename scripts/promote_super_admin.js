const { PrismaClient } = require('@prisma/client')
// Note: We need to import createsClient if the adapter needs it?
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
const { createClient } = require('@libsql/client')

async function main() {
    console.log('--- Super Admin Generator (Fix: Using LibSQL Client Instance) ---')

    // Hardcoded credentials with HTTPS
    const url = "https://book-futbol-zenaku.aws-us-east-1.turso.io"
    const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk2NjE5NTMsImlkIjoiNmQ5ZDBmZjEtMWM0Mi00YTlmLWI2YmEtNDZlMTg3MDhkMWM0IiwicmlkIjoiZmUyMGQ4YjQtOTc2My00NTRhLTg4NzQtMmRlZmQyODg4ZmQzIn0.eKckgVvaeeRv22XcgEsGVRnlOTmXCdje8FP1hbe2NRIzgUQBu4vEjpgxGOSmOAYFbiqVGZcP4rAHrpXdLbIZDw"

    // Safety: Set env var for Prisma just in case
    process.env.DATABASE_URL = url
    process.env.TURSO_AUTH_TOKEN = token

    console.log(`Creating Turso Client...`)

    // According to src/lib/prisma.ts, we use createClient then pass it to adapter?
    // Wait, src/lib/prisma.ts does NOT import createClient. It does:
    // const adapter = new PrismaLibSQL({ url, authToken })
    // BUT the error I got earlier suggests it uses createClient internally?

    // Let's try passing the client instance FIRST (per docs usually). But if src/lib/prisma.ts works...
    // Let's look at src/lib/prisma.ts AGAIN.
    // It imports { PrismaLibSQL } from '@prisma/adapter-libsql'
    // It calls `new PrismaLibSQL({ url, authToken })`

    // So I should do THAT.

    const adapter = new PrismaLibSQL({
        url: url,
        authToken: token
    })

    const prisma = new PrismaClient({ adapter })

    const email = 'super@futbol.com'

    try {
        console.log(`Searching for user: ${email}...`)
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            console.error('User not found! Please create the user first via registration.')
            console.log('\n--- Listing ALL Users ---')
            const users = await prisma.user.findMany({
                select: { email: true, id: true, role: true }
            })
            console.table(users)

            // Auto-promote if only one user exists? No, risk.
            process.exit(1)
        }

        console.log(`Updating user ${user.id} (${user.email}). Current Role: ${user.role || 'USER'}`)
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'SUPERADMIN' }
        })

        console.log('Success! User is now SUPERADMIN.')
        console.log(updated)

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
