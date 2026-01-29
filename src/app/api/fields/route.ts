import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function GET() {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const fields = await prisma.field.findMany({
            where: { complexId }
        })
        return NextResponse.json(fields)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching fields' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { name, type, price, imageUrl, availableDays, openTime, closeTime } = body

        if (!name || !type || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const field = await prisma.field.create({
            data: {
                name,
                type: String(type),
                price: parseFloat(price),
                imageUrl,
                availableDays: availableDays || undefined,
                openTime: openTime || undefined,
                closeTime: closeTime || undefined,
                complexId // Vincular al complejo actual
            }
        })

        return NextResponse.json(field)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating field' }, { status: 500 })
    }
}
