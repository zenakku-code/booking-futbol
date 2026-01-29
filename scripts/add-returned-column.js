// Script to add 'returned' column to BookingItem table
// Run with: node scripts/add-returned-column.js

const { createClient } = require('@libsql/client')
require('dotenv').config()

async function migrate() {
    const client = createClient({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    })

    console.log('🔄 Adding returned column to BookingItem...')

    try {
        await client.execute(`
            ALTER TABLE BookingItem ADD COLUMN returned INTEGER DEFAULT 0
        `)
        console.log('✅ Column added successfully!')
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('⚠️ Column already exists, skipping...')
        } else {
            console.error('❌ Error:', err.message)
        }
    }

    console.log('🎉 Migration complete!')
    process.exit(0)
}

migrate()
