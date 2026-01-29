// Script to add ApiKey table
// Run with: node scripts/add-apikey-table.js

const { createClient } = require('@libsql/client')
require('dotenv').config()

async function migrate() {
    const client = createClient({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    })

    console.log('🔄 Creating ApiKey table...')

    try {
        await client.execute(`
            CREATE TABLE IF NOT EXISTS ApiKey (
                id TEXT NOT NULL PRIMARY KEY,
                key TEXT NOT NULL,
                name TEXT NOT NULL,
                complexId TEXT NOT NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                lastUsed DATETIME,
                CONSTRAINT ApiKey_complexId_fkey FOREIGN KEY (complexId) REFERENCES Complex (id) ON DELETE RESTRICT ON UPDATE CASCADE
            )
        `)

        await client.execute(`
            CREATE UNIQUE INDEX IF NOT EXISTS ApiKey_key_key ON ApiKey(key)
        `)

        console.log('✅ ApiKey table created successfully!')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }

    console.log('🎉 Migration complete!')
    process.exit(0)
}

migrate()
