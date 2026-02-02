const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
const { createClient } = require('@libsql/client')
const bcrypt = require('bcryptjs')

async function main() {
    console.log('--- Seeding Demo Data for Screenshots ---')

    const url = "https://book-futbol-zenaku.aws-us-east-1.turso.io"
    const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk2NjE5NTMsImlkIjoiNmQ5ZDBmZjEtMWM0Mi00YTlmLWI2YmEtNDZlMTg3MDhkMWM0IiwicmlkIjoiZmUyMGQ4YjQtOTc2My00NTRhLTg4NzQtMmRlZmQyODg4ZmQzIn0.eKckgVvaeeRv22XcgEsGVRnlOTmXCdje8FP1hbe2NRIzgUQBu4vEjpgxGOSmOAYFbiqVGZcP4rAHrpXdLbIZDw"
    process.env.DATABASE_URL = "file:./dev.db"

    const adapter = new PrismaLibSQL({ url, authToken: token })
    const prisma = new PrismaClient({ adapter })

    const email = 'demo@futbol.com'
    const password = 'Demo123'
    const complexName = 'Complejo Demo'
    const slug = 'complejo-demo'

    // 1. Clean up existing demo if exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        console.log('Cleaning up previous demo...')
        // Cascading deletes handled by our previous logic, but here we do simple manual cleanup
        await prisma.booking.deleteMany({ where: { field: { complexId: existing.complexId } } })
        await prisma.field.deleteMany({ where: { complexId: existing.complexId } })
        await prisma.user.delete({ where: { id: existing.id } })
        if (existing.complexId) {
            await prisma.complex.delete({ where: { id: existing.complexId } })
        }
    }

    // 2. Create Complex
    console.log('Creating Complex...')
    const complex = await prisma.complex.create({
        data: {
            name: complexName,
            slug,
            subscriptionActive: true,
            subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            planType: 'MONTHLY',
            isActive: true
        }
    })

    // 3. Create User
    console.log('Creating User...')
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
            complexId: complex.id
        }
    })

    // 4. Create Fields
    console.log('Creating Fields...')
    const f5 = await prisma.field.create({
        data: {
            name: 'Cancha 1 (F5)',
            type: '5',
            price: 15000,
            complexId: complex.id,
            openTime: '09:00',
            closeTime: '23:00'
        }
    })

    const f7 = await prisma.field.create({
        data: {
            name: 'Cancha 2 (F7)',
            type: '7',
            price: 22000,
            complexId: complex.id,
            openTime: '10:00',
            closeTime: '24:00'
        }
    })

    // 5. Create Bookings (Today)
    console.log('Creating Bookings...')
    const today = new Date()
    today.setHours(12, 0, 0, 0) // Noon UTC

    await prisma.booking.create({
        data: {
            fieldId: f5.id,
            date: today,
            startTime: '18:00',
            endTime: '19:00',
            clientName: 'Juan Pérez',
            totalPrice: 15000,
            status: 'confirmed',
            paymentType: 'FULL'
        }
    })

    await prisma.booking.create({
        data: {
            fieldId: f5.id,
            date: today,
            startTime: '20:00',
            endTime: '21:00',
            clientName: 'Torneo Local',
            totalPrice: 15000,
            status: 'pending',
            paymentType: 'DEPOSIT'
        }
    })

    console.log('✅ Demo Data Seeded!')
}

main().catch(console.error).finally(() => process.exit(0))
