const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

dotenv.config();

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function seedNewTenant() {
    console.log("Creating new test tenant...");

    const complexId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const fieldId = crypto.randomUUID();

    const email = "dueno2@test.com";
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);
    const complexSlug = "cancha-premium-2";

    try {
        // 1. Create Complex
        await client.execute({
            sql: "INSERT INTO Complex (id, name, slug, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
            args: [complexId, "Canchas Premium Eze", complexSlug, new Date().toISOString(), new Date().toISOString()]
        });

        // 2. Create User
        await client.execute({
            sql: "INSERT INTO User (id, email, password, complexId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
            args: [userId, email, hashedPassword, complexId, new Date().toISOString(), new Date().toISOString()]
        });

        // 3. Create a Field for this complex
        await client.execute({
            sql: 'INSERT INTO Field (id, name, type, price, availableDays, openTime, closeTime, complexId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            args: [fieldId, "Estadio VIP Multitenant", "11", 25000, "Lunes,Sábado,Domingo", "08:00", "00:00", complexId]
        });

        console.log("✨ Test Tenant created successfully!");
        console.log("--------------------------------");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Slug: ${complexSlug}`);
        console.log(`Test URL: /?complex=${complexSlug}`);
        console.log("--------------------------------");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        process.exit(0);
    }
}

seedNewTenant();
