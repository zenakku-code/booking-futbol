const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
require('dotenv').config()

async function main() {
    const url = process.env.DATABASE_URL
    const token = process.env.TURSO_AUTH_TOKEN

    if (!url || !token) {
        console.error('Missing env vars')
        return
    }

    const adapter = new PrismaLibSQL({ url, authToken: token })
    const prisma = new PrismaClient({ adapter })

    try {
        console.log('--- COMPLEXES ---')
        const complexes = await prisma.complex.findMany({
            include: { _count: { select: { fields: true } } }
        })
        complexes.forEach(c => {
            console.log(`[${c.id}] ${c.name} (Slug: ${c.slug})`)
            console.log(`   Enabled: ${c.downPaymentEnabled}, Fixed: ${c.downPaymentFixed}`)
            console.log(`   Fields Count: ${c._count.fields}`)
        })

        console.log('\n--- FIELDS ---')
        const fields = await prisma.field.findMany({
            include: { complex: true }
        })
        fields.forEach(f => {
            console.log(`[${f.id}] ${f.name}:Price \$${f.price}`)
            console.log(`   Linked to Complex: ${f.complexId ? f.complex.name : 'NULL'}`)
            if (f.complex) {
                console.log(`   Complex Settings -> Enabled: ${f.complex.downPaymentEnabled}, Fixed: ${f.complex.downPaymentFixed}`)
                const hasDeposit = f.complex.downPaymentEnabled && f.complex.downPaymentFixed > 0 && f.complex.downPaymentFixed < f.price
                console.log(`   CALCULATED hasDeposit: ${hasDeposit}`)
            }
        })

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
