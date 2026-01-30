import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const complexes = await prisma.complex.findMany()
    if (complexes.length === 0) {
        console.log('No complexes found to link fields to.')
        return
    }

    const targetComplexId = complexes[0].id
    console.log(`Liking fields to complex: ${complexes[0].name} (${targetComplexId})`)

    const result = await prisma.field.updateMany({
        where: { complexId: null },
        data: { complexId: targetComplexId }
    })

    console.log(`Fields updated: ${result.count}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
