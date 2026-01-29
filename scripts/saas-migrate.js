const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN");
    process.exit(1);
}

const client = createClient({ url, authToken });

async function migrate() {
    console.log("Starting SaaS migration...");

    try {
        // 1. Create Complex Table if not exists
        console.log("Ensuring Complex table exists...");
        await client.execute(`
      CREATE TABLE IF NOT EXISTS "Complex" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "address" TEXT,
        "logoUrl" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

        try {
            await client.execute(`CREATE UNIQUE INDEX "Complex_slug_key" ON "Complex"("slug");`);
        } catch (e) {
            console.log("ℹ️ Index Complex_slug_key probably already exists.");
        }

        // 2. Add complexId columns to existing tables if they don't exist
        console.log("Checking for complexId columns...");
        const tables = ["User", "Field", "Account"];
        for (const table of tables) {
            try {
                await client.execute(`ALTER TABLE ${table} ADD COLUMN complexId TEXT;`);
                console.log(`✅ Added complexId to ${table}`);
            } catch (e) {
                if (e.message.includes("duplicate column name") || e.message.includes("already exists")) {
                    console.log(`ℹ️ complexId already exists in ${table}`);
                } else {
                    console.warn(`⚠️ Warning adding column to ${table}:`, e.message);
                }
            }
        }

        // 3. Create default complex
        const complexId = crypto.randomUUID();
        const complexName = "Mi Complejo Deportivo";
        const slug = "mi-complejo";

        console.log(`Creating default complex: ${complexName} (${slug})...`);

        // Check if it already exists
        const existingComplex = await client.execute({
            sql: "SELECT id FROM Complex WHERE slug = ?",
            args: [slug]
        });

        let activeComplexId = complexId;

        if (existingComplex.rows.length === 0) {
            await client.execute({
                sql: "INSERT INTO Complex (id, name, slug, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
                args: [complexId, complexName, slug, new Date().toISOString(), new Date().toISOString()]
            });
            console.log("✅ Complex created.");
        } else {
            activeComplexId = existingComplex.rows[0].id;
            console.log("ℹ️ Complex already exists.");
        }

        // 4. Link existing Users
        console.log("Linking users to complex...");
        await client.execute({
            sql: "UPDATE User SET complexId = ? WHERE complexId IS NULL OR complexId = ''",
            args: [activeComplexId]
        });

        // 5. Link existing Fields
        console.log("Linking fields to complex...");
        await client.execute({
            sql: "UPDATE Field SET complexId = ? WHERE complexId IS NULL OR complexId = ''",
            args: [activeComplexId]
        });

        // 6. Link existing Accounts (Mercado Pago)
        console.log("Linking accounts to complex...");
        await client.execute({
            sql: "UPDATE Account SET complexId = ? WHERE complexId IS NULL OR complexId = ''",
            args: [activeComplexId]
        });

        console.log("✨ SaaS migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        process.exit(0);
    }
}

migrate();
