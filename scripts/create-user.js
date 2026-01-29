const bcrypt = require('bcryptjs');

async function generateHash(password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('--- GENERADOR DE CREDENCIALES ---');
    console.log('Password:', password);
    console.log('Hash para SQL:', hash);
    console.log('-------------------------------');
    console.log('Query para ejecutar en tu DB (puedes usar Prisma Studio o SQLite Explorer):');
    console.log(`INSERT INTO User (id, email, password, createdAt, updatedAt) VALUES ('admin', 'admin@futbol.com', '${hash}', datetime('now'), datetime('now'));`);
}

const pass = process.argv[2] || 'admin123';
generateHash(pass);
