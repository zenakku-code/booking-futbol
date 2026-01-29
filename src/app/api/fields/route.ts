import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const fields = await prisma.field.findMany()
        return NextResponse.json(fields)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching fields' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
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
                closeTime: closeTime || undefined
            }
        })

        return NextResponse.json(field)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating field' }, { status: 500 })
    }
}
