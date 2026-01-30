const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
const { createClient } = require('@libsql/client')
require('dotenv').config()

async function main() {
    const url = process.env.DATABASE_URL
    const token = process.env.TURSO_AUTH_TOKEN

    console.log('ENV Check:', {
        urlProvided: !!url,
        tokenProvided: !!token,
        isLibSql: url?.startsWith('libsql://')
    })

    let prisma

    if (url && token && (url.startsWith('libsql://') || url.includes('turso.io'))) {
        console.log('Initializing Turso Adapter...')
        const adapter = new PrismaLibSQL({
            url: url,
            authToken: token,
        })
        prisma = new PrismaClient({ adapter })
    } else {
        console.log('Using standard provider (Local SQLite?)...')
        prisma = new PrismaClient()
    }

    try {
        // 1. Check Complexes
        const complexes = await prisma.complex.findMany()
        console.log(`Found ${complexes.length} complexes.`)

        if (complexes.length === 0) {
            console.error('CRITICAL: No complex found in DB. Creating default...')
            // Create a default complex if none exists (Safety fallback)
            const newComplex = await prisma.complex.create({
                data: {
                    name: 'Complejo Principal',
                    slug: 'complejo-principal',
                    subscriptionActive: true,
                    downPaymentEnabled: true,
                    downPaymentFixed: 10000
                }
            })
            console.log('Created Default Complex:', newComplex.id)
            complexes.push(newComplex)
        }

        const targetComplex = complexes[0]
        console.log(`Target Complex for linking: ${targetComplex.name} (Deposit: ${targetComplex.downPaymentFixed})`)

        // 2. Check Fields
        const fields = await prisma.field.findMany({
            include: { complex: true }
        })
        console.log(`Found ${fields.length} fields.`)

        // 3. Find Orphans
        const orphans = fields.filter(f => !f.complexId)
        console.log(`Found ${orphans.length} orphan fields.`)

        if (orphans.length > 0) {
            console.log('Linking orphans to target complex...')
            const result = await prisma.field.updateMany({
                where: { complexId: null },
                data: { complexId: targetComplex.id }
            })
            console.log(`Updated ${result.count} fields.`)
        } else {
            console.log('No orphan fields to fix.')
        }

        // 4. Verify Deposit Logic for the specific case mentioned
        const testField = fields.find(f => f.price === 40000)
        if (testField) {
            console.log('Test Field Check (40k):', {
                name: testField.name,
                price: testField.price,
                complexId: testField.complexId,
                complexDeposit: testField.complex ? testField.complex.downPaymentFixed : 'N/A'
            })
        } else {
            // Look for any field
            const f = fields[0]
            if (f) {
                console.log('Sample Field Check:', {
                    name: f.name,
                    price: f.price,
                    complexId: f.complexId,
                    complexDeposit: f.complex ? f.complex.downPaymentFixed : 'N/A'
                })
            }
        }

    } catch (e) {
        console.error('Script Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
