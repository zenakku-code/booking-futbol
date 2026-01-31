
const { PrismaClient } = require('@prisma/client')
// Use the global prisma instance if possible or create new, but for script new is fine
const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Limpiando suscripciones y trials...')

    try {
        // 1. Delete all subscription payments
        console.log('- Eliminando historial de pagos...')
        await prisma.subscriptionPayment.deleteMany({})

        // 2. Reset Complex fields
        console.log('- Reseteando estado de complejos...')
        await prisma.complex.updateMany({
            data: {
                subscriptionActive: false,
                trialEndsAt: null,
                subscriptionDate: null,
                subscriptionEndsAt: null,
                planType: null
            }
        })

        console.log('✅ Base de datos reseteada correctamente.')

    } catch (e) {
        console.error('❌ Error al resetear DB:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
