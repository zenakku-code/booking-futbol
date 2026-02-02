const { PrismaClient } = require('@prisma/client')
const { PrismaLibSQL } = require('@prisma/adapter-libsql')
const { createClient } = require('@libsql/client')
const bcrypt = require('bcryptjs')

async function main() {
    console.log('--- Creating Custom Super Admin (LibSQL) ---')

    // Hardcoded credentials for script execution (same as promote_super_admin.js)
    const url = "https://book-futbol-zenaku.aws-us-east-1.turso.io"
    const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk2NjE5NTMsImlkIjoiNmQ5ZDBmZjEtMWM0Mi00YTlmLWI2YmEtNDZlMTg3MDhkMWM0IiwicmlkIjoiZmUyMGQ4YjQtOTc2My00NTRhLTg4NzQtMmRlZmQyODg4ZmQzIn0.eKckgVvaeeRv22XcgEsGVRnlOTmXCdje8FP1hbe2NRIzgUQBu4vEjpgxGOSmOAYFbiqVGZcP4rAHrpXdLbIZDw"

    // Set env var to satisfy Prisma validation (even if adapter overrides it)
    process.env.DATABASE_URL = "file:./dev.db"

    const adapter = new PrismaLibSQL({
        url: url,
        authToken: token
    })

    const prisma = new PrismaClient({ adapter })

    const email = 'zamoranoezequiel3@gmail.com'
    const password = 'Admin123'

    console.log(`Checking user: ${email}...`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (user) {
        console.log(`User found (ID: ${user.id}). Promoting to SUPERADMIN...`)
        await prisma.user.update({
            where: { email },
            data: { role: 'SUPERADMIN' }
        })
        console.log('✅ User promoted successfully!')
    } else {
        console.log('User not found. Creating new SUPERADMIN...')
        const hashedPassword = await bcrypt.hash(password, 10)

        // Ensure complexId is handled if Schema requires it (it's nullable based on my review, but let's be safe)
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'SUPERADMIN',
                // complexId: null // Explicitly null
            }
        })
        console.log(`✅ User created successfully! Password: ${password}`)
        console.log(`User ID: ${newUser.id}`)
    }

    await prisma.$disconnect()
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
