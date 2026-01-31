
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Testing access to SubscriptionPayment...')
        if (!prisma.subscriptionPayment) {
            console.error('❌ prisma.subscriptionPayment is UNDEFINED')
            return
        }

        console.log('Access successful. Attempting query...')
        const count = await prisma.subscriptionPayment.count()
        console.log(`✅ SubscriptionPayment count: ${count}`)

        console.log('Testing aggregate...')
        const totalRevenue = await prisma.subscriptionPayment.aggregate({
            where: { status: 'approved' },
            _sum: { amount: true }
        })
        console.log('✅ Aggregate result:', totalRevenue)

        console.log('Testing "Complex" planType query...')
        const complexCount = await prisma.complex.count({
            where: { planType: 'MONTHLY' }
        })
        console.log(`✅ Complex Monthly count: ${complexCount}`)

    } catch (e) {
        console.error('❌ Error querying SubscriptionPayment:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
