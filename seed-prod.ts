import { createClient } from '@libsql/client'
import bcrypt from "bcryptjs";
import 'dotenv/config';

// Force credentials to what the user provided
const url = process.env.DATABASE_URL || "libsql://tu-db-turso.aws...turso.io";
const authToken = process.env.DATABASE_AUTH_TOKEN || "tu_turso_token_aqui";

const libsql = createClient({
    url: url,
    authToken: authToken,
})

async function main() {
    console.log("Conectando a la Base de Datos con Adaptador Turso nativo...");
    console.log("DATABASE_URL actual:", url);

    const passwordHash = await bcrypt.hash("password", 10);
    const email = "admin@tikitaka.com";

    // 1. Force additions of missing columns because of un-synced Prisma Prod Schema
    const newColumns = [
        "ALTER TABLE User ADD COLUMN name TEXT NOT NULL DEFAULT 'SuperAdministrador'",
        "ALTER TABLE User ADD COLUMN emailVerified BOOLEAN NOT NULL DEFAULT 0",
        "ALTER TABLE User ADD COLUMN image TEXT",
        "ALTER TABLE User ADD COLUMN role TEXT DEFAULT 'USER'",
        "ALTER TABLE User ADD COLUMN complexId TEXT",
        "ALTER TABLE User ADD COLUMN password TEXT"
    ];

    for (const statement of newColumns) {
        try {
            await libsql.execute(statement);
            console.log(`[OK] Migración Cruda: ${statement.split("ADD COLUMN ")[1]}`);
        } catch (e: any) {
            if (!e.message.includes("duplicate column")) {
                console.error(`Error en columna: ${e.message}`);
            }
        }
    }

    // Revisa si existe
    const exists = await libsql.execute({
        sql: "SELECT id FROM User WHERE email = ?",
        args: [email]
    });

    if (exists.rows.length > 0) {
        console.log("El usuario ya existe, actualizando contraseña y rol...");
        await libsql.execute({
            sql: "UPDATE User SET password = ?, role = 'SUPERADMIN', name = 'SuperAdministrador' WHERE email = ?",
            args: [passwordHash, email]
        });
    } else {
        console.log("Creando usuario nuevo SUPERADMIN...");
        // Genera uuid básico
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();

        await libsql.execute({
            sql: `INSERT INTO User (id, name, email, emailVerified, password, image, role, complexId, createdAt, updatedAt) 
                  VALUES (?, ?, ?, ?, ?, NULL, 'SUPERADMIN', NULL, ?, ?)`,
            args: [newId, "SuperAdministrador", email, 1, passwordHash, now, now]
        });
    }

    console.log("-----------------------------------------");
    console.log("🌟 SUPERADMIN Generado EXITOSAMENTE en Producción:");
    console.log("Email: " + email);
    console.log("Contraseña: password");
    console.log("Rol: SUPERADMIN");
    console.log("-----------------------------------------");
}

main().catch(console.error).finally(() => libsql.close());
