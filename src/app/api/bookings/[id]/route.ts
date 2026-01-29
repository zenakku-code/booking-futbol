import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status } = body // e.g. "confirmed", "cancelled"

        const booking = await prisma.booking.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json(booking)
    } catch (error) {
        return NextResponse.json({ error: 'Error updating booking' }, { status: 500 })
    }
}
