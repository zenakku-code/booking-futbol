import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const complexId = await getComplexId()
        if (!complexId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { name, price, stock } = body

        // Verify ownership
        const existing = await (prisma as any).inventoryItem.findFirst({
            where: { id, complexId }
        })

        if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

        const updated = await (prisma as any).inventoryItem.update({
            where: { id },
            data: {
                name: name || undefined,
                price: price !== undefined ? parseFloat(price) : undefined,
                stock: stock !== undefined ? parseInt(stock) : undefined,
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: 'Error updating' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const complexId = await getComplexId()
        if (!complexId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const { id } = await params

        // Verify ownership
        const existing = await (prisma as any).inventoryItem.findFirst({
            where: { id, complexId }
        })

        if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

        await (prisma as any).inventoryItem.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting' }, { status: 500 })
    }
}
