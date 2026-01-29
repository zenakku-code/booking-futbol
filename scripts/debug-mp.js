const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugMP() {
    console.log('--- TEST DE PREFERENCIA MERCADO PAGO ---')

    const account = await prisma.account.findFirst({
        where: { provider: 'mercadopago' }
    })

    if (!account || !account.accessToken) {
        console.error('❌ No se encontrÃ³ cuenta de Mercado Pago en la DB.')
        return
    }

    console.log('Token encontrado:', account.accessToken.substring(0, 20) + '...')

    const payload = {
        items: [
            {
                title: 'Test Reserva Debug',
                quantity: 1,
                currency_id: 'ARS',
                unit_price: 100
            }
        ],
        back_urls: {
            success: 'http://localhost:3000/?status=success',
            failure: 'http://localhost:3000/?status=failure',
            pending: 'http://localhost:3000/?status=pending'
        },
        auto_return: 'approved'
    }

    try {
        const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${account.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        const data = await res.json()
        console.log('Status HTTP:', res.status)

        if (res.ok) {
            console.log('✅ Preferencia creada!')
            console.log('Init Point:', data.init_point)
        } else {
            console.error('❌ Error de Mercado Pago:', JSON.stringify(data, null, 2))
        }
    } catch (err) {
        console.error('❌ Error de Red:', err)
    } finally {
        await prisma.$disconnect()
    }
}

debugMP()
