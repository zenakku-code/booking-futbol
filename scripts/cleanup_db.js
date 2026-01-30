const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
require('dotenv').config()

async function main() {
    const url = process.env.DATABASE_URL
    const token = process.env.TURSO_AUTH_TOKEN
    const adapter = new PrismaLibSQL({ url, authToken: token })
    const prisma = new PrismaClient({ adapter })

    try {
        console.log('Cleaning up zombie fields...')
        // Delete fields where there is no complex
        // Prisma doesn't support 'where complex IS NULL' easily if it expects a relation, 
        // but we can search for complexId that doesn't exist in Complex table.
        // Actually, we can just fetch all and delete manually nicely.

        const fields = await prisma.field.findMany({
            include: { complex: true }
        })

        const zombies = fields.filter(f => !f.complex && f.complexId)
        console.log(`Found ${zombies.length} zombies.`)

        for (const z of zombies) {
            console.log(`Deleting zombie field: ${z.name} (${z.id})`)
            await prisma.field.delete({ where: { id: z.id } })
        }

        // Also fix any complex with downPaymentEnabled=true but downPaymentFixed=0 ?
        // Usually that's valid (0 seña). But let's check.
        const oddComplexes = await prisma.complex.findMany({
            where: {
                downPaymentEnabled: true,
                downPaymentFixed: { equals: 0 }
            }
        })
        if (oddComplexes.length > 0) {
            console.log('Warning: Found complexes with Enabled=true but Fixed=0. This might confuse logic.')
            oddComplexes.forEach(c => console.log(`- ${c.name}`))
        }

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
