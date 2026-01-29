const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
    console.log('Starting migration for Split Payments...');

    try {
        // 1. Add fields to Booking
        console.log('Updating Booking table...');

        try {
            await client.execute(`ALTER TABLE Booking ADD COLUMN paymentType TEXT DEFAULT 'FULL'`);
            console.log('✓ Added paymentType column');
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log('ℹ paymentType column already exists');
            } else {
                console.log('⚠ specific error adding paymentType:', e.message);
            }
        }

        try {
            await client.execute(`ALTER TABLE Booking ADD COLUMN paidAmount REAL DEFAULT 0`);
            console.log('✓ Added paidAmount column');
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log('ℹ paidAmount column already exists');
            } else {
                console.log('⚠ specific error adding paidAmount:', e.message);
            }
        }

        // 2. Create Payment Table
        console.log('Creating Payment table...');
        await client.execute(`
      CREATE TABLE IF NOT EXISTS Payment (
        id TEXT NOT NULL PRIMARY KEY,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        externalId TEXT,
        payerEmail TEXT,
        bookingId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT Payment_bookingId_fkey FOREIGN KEY (bookingId) REFERENCES Booking (id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
        console.log('✓ Payment table ensured');

        // Indices for Payment
        await client.execute(`CREATE INDEX IF NOT EXISTS Payment_bookingId_idx ON Payment(bookingId)`);
        await client.execute(`CREATE INDEX IF NOT EXISTS Payment_externalId_idx ON Payment(externalId)`);
        console.log('✓ Indices created');

        console.log('Migration completed successfully! 🚀');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.close();
    }
}

main();
