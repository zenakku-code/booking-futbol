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
        const { status } = body // e.g. "confirmed", "cancelled"

        // Verificar que la reserva pertenece al complejo (vía field)
        const booking = await prisma.booking.findFirst({
            where: {
                id,
                field: { complexId }
            }
        })

        if (!booking) {
            return NextResponse.json({ error: 'Reserva no encontrada o no autorizada' }, { status: 404 })
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json(updatedBooking)
    } catch (error) {
        console.error('Error updating booking:', error)
        return NextResponse.json({ error: 'Error updating booking' }, { status: 500 })
    }
}
