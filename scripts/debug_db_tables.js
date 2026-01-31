const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    console.log('🔍 Checking database tables...');
    try {
        const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
        const tables = result.rows.map(r => r.name); // Access 'name' property directly from row object

        console.log('📂 Tables found:', tables);

        if (tables.includes('Complex')) {
            console.log('✅ Complex table EXISTS! (Connected to Production)');
            const count = await client.execute("SELECT count(*) as c FROM Complex");
            console.log('   Complex Count:', count.rows[0]);
        } else {
            console.error('❌ Complex table MISSING! (Connected to EMPTY/WRONG DB)');
        }

        if (tables.includes('SystemConfig')) {
            console.log('✅ SystemConfig table EXISTS!');

            // Inspect columns
            const cols = await client.execute("PRAGMA table_info(SystemConfig);");
            console.log('📋 Columns:', cols.rows);

            // Check data
            const data = await client.execute("SELECT * FROM SystemConfig");
            console.log('📊 Data:', data.rows);

        } else {
            console.error('❌ SystemConfig table MISSING!');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.close();
    }
}

main();
