const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
    const url = process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error('Error: DATABASE_URL no estÃ¡ definida');
        process.exit(1);
    }

    const client = createClient({ url, authToken });

    const email = 'admin@futbol.com';
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log(`Intentando crear admin en Turso: ${email}`);

    try {
        // Check if exists
        const rs = await client.execute({
            sql: 'SELECT id FROM User WHERE email = ?',
            args: [email]
        });

        if (rs.rows.length > 0) {
            console.log('El usuario ya existe. Actualizando password...');
            await client.execute({
                sql: 'UPDATE User SET password = ?, updatedAt = ? WHERE email = ?',
                args: [hashedPassword, new Date().toISOString(), email]
            });
        } else {
            console.log('Creando nuevo usuario admin...');
            const id = crypto.randomUUID();
            await client.execute({
                sql: 'INSERT INTO User (id, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
                args: [id, email, hashedPassword, new Date().toISOString(), new Date().toISOString()]
            });
        }
        console.log('âœ… Admin configurado con Ã©xito!');
    } catch (e) {
        console.error('â Œ Error en seeding:', e);
    } finally {
        process.exit(0);
    }
}

main();
