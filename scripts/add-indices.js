// Script to add indices for performance optimization
// Run with: node scripts/add-indices.js

const { createClient } = require('@libsql/client')
require('dotenv').config()

async function migrate() {
    const client = createClient({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    })

    console.log('🔄 Creating database indices...')

    try {
        // Field indices
        await client.execute(`CREATE INDEX IF NOT EXISTS Field_complexId_idx ON Field(complexId)`)

        // InventoryItem indices
        await client.execute(`CREATE INDEX IF NOT EXISTS InventoryItem_complexId_idx ON InventoryItem(complexId)`)

        // Booking indices
        await client.execute(`CREATE INDEX IF NOT EXISTS Booking_fieldId_idx ON Booking(fieldId)`)
        await client.execute(`CREATE INDEX IF NOT EXISTS Booking_fieldId_date_idx ON Booking(fieldId, date)`)
        await client.execute(`CREATE INDEX IF NOT EXISTS Booking_status_idx ON Booking(status)`)

        // BookingItem indices
        await client.execute(`CREATE INDEX IF NOT EXISTS BookingItem_bookingId_idx ON BookingItem(bookingId)`)
        await client.execute(`CREATE INDEX IF NOT EXISTS BookingItem_inventoryItemId_idx ON BookingItem(inventoryItemId)`)

        // Account indices
        await client.execute(`CREATE INDEX IF NOT EXISTS Account_complexId_idx ON Account(complexId)`)

        // User indices
        await client.execute(`CREATE INDEX IF NOT EXISTS User_complexId_idx ON User(complexId)`)

        // ApiKey indices
        await client.execute(`CREATE INDEX IF NOT EXISTS ApiKey_complexId_idx ON ApiKey(complexId)`)

        console.log('✅ Indices created successfully!')
    } catch (err) {
        console.error('❌ Error creating indices:', err.message)
    }

    console.log('🎉 Optimization complete!')
    process.exit(0)
}

migrate()
