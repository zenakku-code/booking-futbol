const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
    const url = process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error('Error: DATABASE_URL no estÃ¡ definida en el .env');
        process.exit(1);
    }

    console.log(`Conectando a: ${url}`);

    const client = createClient({
        url: url,
        authToken: authToken,
    });

    try {
        const sqlPath = path.join(__dirname, '../init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Ejecutando script de inicialización...');

        // Split by semicolon and filter out empty/whitespace statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await client.execute(statement);
            } catch (err) {
                // Ignore "already exists" errors if any, but log others
                if (!err.message.includes('already exists')) {
                    throw err;
                }
            }
        }

        console.log('✅ Base de datos inicializada correctamente!');
    } catch (error) {
        console.error('❌ Error inicializando la base de datos:', error);
    } finally {
        // No disconnect needed for this client usually, but good to exit
        process.exit(0);
    }
}

main();
