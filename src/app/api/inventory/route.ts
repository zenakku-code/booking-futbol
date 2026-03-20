import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function GET() {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const items = await (prisma as any).inventoryItem.findMany({
            where: { complexId },
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(items)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching inventory' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { name, price, stock } = body

        if (!name || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const item = await (prisma as any).inventoryItem.create({
            data: {
                name,
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                complexId
            }
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating inventory item' }, { status: 500 })
    }
}
