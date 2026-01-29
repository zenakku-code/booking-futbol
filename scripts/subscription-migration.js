const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
}

const client = createClient({ url, authToken });

async function migrate() {
    console.log("🚀 Starting Subscription & Inventory migration for Turso...");

    try {
        // 1. Add subscription columns to Complex
        console.log("Step 1: Updating Complex table...");
        try {
            await client.execute(`ALTER TABLE "Complex" ADD COLUMN "subscriptionActive" BOOLEAN NOT NULL DEFAULT 0;`);
            console.log("✅ Added subscriptionActive to Complex");
        } catch (e) {
            console.log("ℹ️ subscriptionActive might already exist:", e.message);
        }

        try {
            await client.execute(`ALTER TABLE "Complex" ADD COLUMN "subscriptionDate" DATETIME;`);
            console.log("✅ Added subscriptionDate to Complex");
        } catch (e) {
            console.log("ℹ️ subscriptionDate might already exist:", e.message);
        }

        // 2. Create InventoryItem table
        console.log("Step 2: Creating InventoryItem table...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS "InventoryItem" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "name" TEXT NOT NULL,
                "price" REAL NOT NULL,
                "stock" INTEGER NOT NULL DEFAULT 0,
                "complexId" TEXT NOT NULL,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "InventoryItem_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
        `);
        console.log("✅ InventoryItem table ensured");

        // 3. Create BookingItem table
        console.log("Step 3: Creating BookingItem table...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS "BookingItem" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "bookingId" TEXT NOT NULL,
                "inventoryItemId" TEXT NOT NULL,
                "quantity" INTEGER NOT NULL DEFAULT 1,
                "priceAtBooking" REAL NOT NULL,
                CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "BookingItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );
        `);
        console.log("✅ BookingItem table ensured");

        console.log("✨ Migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        process.exit(0);
    }
}

migrate();
