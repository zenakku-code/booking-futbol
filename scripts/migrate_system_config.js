
const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    console.log('🔄 Iniciando migración de SystemConfig...');

    try {
        // 1. Create Table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS SystemConfig (
        id TEXT PRIMARY KEY NOT NULL,
        monthlyPrice REAL NOT NULL DEFAULT 10000,
        quarterlyPrice REAL NOT NULL DEFAULT 27000,
        updatedAt DATETIME NOT NULL
      );
    `);
        console.log('✅ Tabla SystemConfig creada (o ya existía).');

        // 2. Check if row exists
        const result = await client.execute('SELECT count(*) as count FROM SystemConfig');
        const count = result.rows[0].count; // or .rows[0][0] depending on driver version, usually rows is array of objects if mapped

        if (count === 0) {
            console.log('✨ Insertando configuración por defecto...');
            const now = new Date().toISOString();
            const uuid = crypto.randomUUID();

            await client.execute({
                sql: `INSERT INTO SystemConfig (id, monthlyPrice, quarterlyPrice, updatedAt) VALUES (?, ?, ?, ?)`,
                args: [uuid, 10000, 27000, now]
            });
            console.log('✅ Configuración inicial insertada.');
        } else {
            console.log('ℹ️ La configuración ya existe, se omite inserción.');
        }

    } catch (error) {
        console.error('❌ Error en migración:', error);
    } finally {
        client.close();
    }
}

main();
