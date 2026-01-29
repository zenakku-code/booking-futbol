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

        // Split by semicolon but ignore semicolons inside strings or comments might be tricky
        // For simplicity, we split by common Prisma patterns or just execute the whole thing if the driver supports it
        // LibSQL executeMultiple or similar?

        console.log('Ejecutando script de inicializaciÃ³n...');

        // We can use executeMultiple for a block of commands
        await client.executeMultiple(sql);

        console.log('âœ… Base de datos inicializada correctamente!');
    } catch (error) {
        console.error('â Œ Error inicializando la base de datos:', error);
    } finally {
        // No disconnect needed for this client usually, but good to exit
        process.exit(0);
    }
}

main();
