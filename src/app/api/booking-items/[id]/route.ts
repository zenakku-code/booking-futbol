import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { returned } = body

        // Find the booking item and verify ownership
        const bookingItem = await (prisma as any).bookingItem.findUnique({
            where: { id },
            include: {
                inventoryItem: true,
                booking: { include: { field: true } }
            }
        })

        if (!bookingItem) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
        }

        // Verify tenant isolation
        if (bookingItem.booking.field.complexId !== complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        // Update the returned status
        const updated = await (prisma as any).bookingItem.update({
            where: { id },
            data: { returned: !!returned }
        })

        // If marked as returned, restore inventory stock
        if (returned && !bookingItem.returned) {
            await (prisma as any).inventoryItem.update({
                where: { id: bookingItem.inventoryItemId },
                data: { stock: { increment: bookingItem.quantity } }
            })
        }

        // If unmarked (rare case), decrement stock again
        if (!returned && bookingItem.returned) {
            await (prisma as any).inventoryItem.update({
                where: { id: bookingItem.inventoryItemId },
                data: { stock: { decrement: bookingItem.quantity } }
            })
        }

        return NextResponse.json({ success: true, item: updated })
    } catch (error) {
        console.error('Error updating booking item:', error)
        return NextResponse.json({ error: 'Error updating item' }, { status: 500 })
    }
}
