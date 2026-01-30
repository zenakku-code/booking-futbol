const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
require('dotenv').config()

async function main() {
    const url = process.env.DATABASE_URL
    const token = process.env.TURSO_AUTH_TOKEN
    const adapter = new PrismaLibSQL({ url, authToken: token })
    const prisma = new PrismaClient({ adapter })

    try {
        console.log('Listing ALL fields to debug...')
        const fields = await prisma.field.findMany({
            include: { complex: true }
        })

        for (const f of fields) {
            console.log(`\n--- FIELD: ${f.name} ---`)
            console.log(`ID: ${f.id}`)
            console.log(`Price: ${f.price}`)
            console.log(`Complex ID: ${f.complexId}`)

            if (f.complex) {
                console.log(`Complex Name: ${f.complex.name}`)
                console.log(`Complex Settings:`)
                console.log(`  - Enabled: ${f.complex.downPaymentEnabled}`)
                console.log(`  - Fixed Amount: ${f.complex.downPaymentFixed}`)

                const calculatedHasDeposit = f.complex.downPaymentEnabled && f.complex.downPaymentFixed > 0 && f.complex.downPaymentFixed < f.price
                console.log(`Simulated Server Logic (hasDeposit): ${calculatedHasDeposit}`)
            } else {
                console.error('CRITICAL: Field has NO COMPLEX linked!')
            }
        }

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
