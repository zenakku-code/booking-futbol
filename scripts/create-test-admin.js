const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = 'tester@futbol.com'
    const password = 'password123'

    console.log('--- CREANDO USUARIO DE PRUEBA ---')

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword
            },
            create: {
                id: 'admin-tester',
                email,
                password: hashedPassword
            }
        })
        console.log('✅ Usuario de prueba creado con éxito!')
        console.log('Email:', user.email)
        console.log('Password: password123')
    } catch (e) {
        console.error('❌ Error al crear el usuario:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
