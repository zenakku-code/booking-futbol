const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    const complexName = 'bombonera'; // Search term
    console.log(`🔍 Buscando complejo que contenga: "${complexName}"...`);

    try {
        // 1. Find the complex
        const result = await client.execute({
            sql: "SELECT * FROM Complex WHERE name LIKE ?",
            args: [`%${complexName}%`]
        });

        if (result.rows.length === 0) {
            console.error('❌ No se encontró ningún complejo con ese nombre.');
            return;
        }

        if (result.rows.length > 1) {
            console.error('⚠️ Se encontraron múltiples complejos. Por favor sé más específico:');
            result.rows.forEach(r => console.log(` - ${r.name} (ID: ${r.id})`));
            return;
        }

        const complex = result.rows[0];
        console.log(`✅ Complejo encontrado: ${complex.name} (ID: ${complex.id})`);

        // 2. Get Current Pricing
        const configResult = await client.execute("SELECT * FROM SystemConfig ORDER BY updatedAt DESC LIMIT 1");
        let amount = 27000; // Fallback

        if (configResult.rows.length > 0) {
            const config = configResult.rows[0];
            amount = config.quarterlyPrice;
            console.log(`💲 Precio trimestral obtenido de DB: $${amount}`);
        } else {
            console.log('⚠️ No se encontró configuración de precios, usando default $27,000');
        }

        // 3. Activate Quarterly Subscription
        const now = new Date();
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 90); // 90 days for Quarterly

        console.log(`🔄 Activando suscripción TRIMESTRAL hasta ${endsAt.toISOString()}...`);

        await client.execute({
            sql: `UPDATE Complex SET 
                subscriptionActive = 1,
                subscriptionDate = ?,
                subscriptionEndsAt = ?,
                planType = 'QUARTERLY',
                trialEndsAt = NULL
                WHERE id = ?`,
            args: [now.toISOString(), endsAt.toISOString(), complex.id]
        });

        // 4. Insert Payment Record for Stats
        const uuid = crypto.randomUUID();
        console.log(`💰 Registrando pago manual por $${amount} para estadísticas...`);
        await client.execute({
            sql: `INSERT INTO SubscriptionPayment (id, complexId, amount, planType, status, createdAt, updatedAt) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [uuid, complex.id, amount, 'QUARTERLY', 'approved', now.toISOString(), now.toISOString()]
        });

        console.log('🎉 ¡Suscripción activada correctamente!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.close();
    }
}

main();
