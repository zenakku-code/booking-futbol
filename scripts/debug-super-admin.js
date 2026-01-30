const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')

async function main() {
    console.log('--- Debugging Super Admin User ---')

    const url = "https://book-futbol-zenaku.aws-us-east-1.turso.io"
    const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk2NjE5NTMsImlkIjoiNmQ5ZDBmZjEtMWM0Mi00YTlmLWI2YmEtNDZlMTg3MDhkMWM0IiwicmlkIjoiZmUyMGQ4YjQtOTc2My00NTRhLTg4NzQtMmRlZmQyODg4ZmQzIn0.eKckgVvaeeRv22XcgEsGVRnlOTmXCdje8FP1hbe2NRIzgUQBu4vEjpgxGOSmOAYFbiqVGZcP4rAHrpXdLbIZDw"

    const adapter = new PrismaLibSQL({ url, authToken: token })
    const prisma = new PrismaClient({ adapter })

    try {
        console.log('\n=== All Users ===')
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                complexId: true,
                createdAt: true
            }
        })
        console.table(users)

        console.log('\n=== Looking for super@futbol.com ===')
        const superUser = await prisma.user.findUnique({
            where: { email: 'super@futbol.com' },
            select: {
                id: true,
                email: true,
                role: true,
                complexId: true,
                password: true
            }
        })

        if (superUser) {
            console.log('✅ User found!')
            console.log('ID:', superUser.id)
            console.log('Email:', superUser.email)
            console.log('Role:', superUser.role)
            console.log('ComplexId:', superUser.complexId)
            console.log('Password Hash:', superUser.password.substring(0, 20) + '...')
        } else {
            console.log('❌ User NOT found!')
        }

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
