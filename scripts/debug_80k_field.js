const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
require('dotenv').config()

async function main() {
    const url = process.env.DATABASE_URL
    const token = process.env.TURSO_AUTH_TOKEN
    const adapter = new PrismaLibSQL({ url, authToken: token })
    const prisma = new PrismaClient({ adapter })

    try {
        console.log('Searching for field with price 80000...')
        const fields = await prisma.field.findMany({
            where: { price: 80000 },
            include: { complex: true }
        })

        if (fields.length === 0) {
            console.log('No field with price 80,000 found. Listing all recent fields:')
            const recent = await prisma.field.findMany({
                orderBy: { id: 'desc' }, // assuming uuid doesn't order by time, but let's try
                take: 5,
                include: { complex: true }
            })
            recent.forEach(f => printField(f))
            return
        }

        console.log(`Found ${fields.length} matching fields.`)
        fields.forEach(f => printField(f))

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

function printField(f) {
    console.log(`\n--- FIELD: ${f.name} (ID: ${f.id}) ---`)
    console.log(`Price: ${f.price}`)
    if (f.complex) {
        console.log(`Linked Complex: ${f.complex.name} (ID: ${f.complex.id})`)
        console.log(`   [SETTINGS] -> Enabled: ${f.complex.downPaymentEnabled}`)
        console.log(`   [SETTINGS] -> Fixed: ${f.complex.downPaymentFixed}`)
    } else {
        console.log('CRITICAL: Field has NO COMPLEX linked (Orphan)')
    }
}

main()
