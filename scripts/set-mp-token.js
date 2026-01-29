const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- CONFIGURANDO MERCADO PAGO MANUALMENTE ---')

    // Datos extraídos de la captura de "Credenciales de Producción"
    const publicKey = 'APP_USR-35bb9ac8-7601-450d-9485-3458fdbe2360'
    const accessToken = 'APP_USR-2409197000708210-012900-77eb3ed68c70e5522291c35affeac7a2-280741774'

    try {
        // Primero borramos si existe alguna conexión previa para limpiar
        await prisma.account.deleteMany({
            where: { provider: 'mercadopago' }
        })

        const account = await prisma.account.create({
            data: {
                provider: 'mercadopago',
                accessToken: accessToken,
                publicKey: publicKey,
                userId: 'admin'
            }
        })

        console.log('✅ Mercado Pago configurado con éxito!')
        console.log('ID Conexión:', account.id)
    } catch (e) {
        console.error('❌ Error configurando la cuenta:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
