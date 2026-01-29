import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'
import { randomBytes } from 'crypto'

export async function GET(request: Request) {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const keys = await (prisma as any).apiKey.findMany({
            where: { complexId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                key: true, // In a real app we might only show first/last chars or mask it
                createdAt: true,
                lastUsed: true
            }
        })

        // Mask keys on the fly for display
        const maskedKeys = keys.map((k: any) => ({
            ...k,
            key: k.key.substring(0, 8) + '...'
        }))

        return NextResponse.json({ success: true, keys: maskedKeys })
    } catch (error) {
        console.error('Error fetching keys:', error)
        return NextResponse.json({ error: 'Error fetching keys' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { name } = await request.json()
        if (!name) {
            return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
        }

        // Generate a secure random key
        // Format: sk_live_randomString
        const randomStr = randomBytes(24).toString('hex')
        const apiKey = `sk_live_${randomStr}`

        const newKey = await (prisma as any).apiKey.create({
            data: {
                name,
                key: apiKey,
                complexId
            }
        })

        return NextResponse.json({ success: true, key: newKey })
    } catch (error) {
        console.error('Error creating key:', error)
        return NextResponse.json({ error: 'Error creating key' }, { status: 500 })
    }
}
