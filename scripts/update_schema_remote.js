const { createClient } = require('@libsql/client')
require('dotenv').config()

async function main() {
    const url = process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    if (!url || !authToken) {
        console.error('Missing DATABASE_URL or TURSO_AUTH_TOKEN')
        process.exit(1)
    }

    // Fix: Ensure URL is https for raw client if needed or libsql is supported
    // The @libsql/client supports libsql:// protocol
    const client = createClient({
        url: url.replace('libsql://', 'https://'), // Raw HTTP is safer for simple exec
        authToken
    })

    const queries = [
        `ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'USER'`,
        `ALTER TABLE "Complex" ADD COLUMN "subscriptionActive" BOOLEAN DEFAULT 1`,
        `ALTER TABLE "Complex" ADD COLUMN "trialEndsAt" DATETIME`,
        `ALTER TABLE "Complex" ADD COLUMN "isActive" BOOLEAN DEFAULT 1`
    ]

    console.log('Applying schema changes directly to Turso...')

    for (const q of queries) {
        try {
            console.log(`Executing: ${q}`)
            await client.execute(q)
            console.log('  -> Success')
        } catch (e) {
            if (e.message && e.message.includes('duplicate column name')) {
                console.log('  -> Column already exists (Skipping)')
            } else {
                console.error('  -> Error:', e.message)
            }
        }
    }

    console.log('Schema update complete.')
}

main()
