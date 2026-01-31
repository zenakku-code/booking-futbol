const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    console.log('🧹 Limpiando suscripciones de TODOS los complejos...');
    try {
        await client.execute(`
            UPDATE Complex 
            SET 
                subscriptionActive = 0, 
                subscriptionDate = NULL, 
                subscriptionEndsAt = NULL, 
                planType = NULL, 
                trialEndsAt = NULL
        `);

        // También limpiamos los pagos para que no haya historial confuso
        // Opcional: Si quieres mantener historial de pagos, comenta esto.
        // Pero para un "reset" completo, mejor limpiar.
        // await client.execute('DELETE FROM SubscriptionPayment'); // Descomentar si se quiere borrar historial

        console.log('✅ Base de datos reseteada. Todas las suscripciones han sido eliminadas.');
    } catch (error) {
        console.error('❌ Error al resetear:', error);
    } finally {
        client.close();
    }
}

main();
