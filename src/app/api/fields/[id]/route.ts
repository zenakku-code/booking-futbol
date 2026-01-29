import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Handling async params (Next.js 15)
) {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { id } = await params

        // Verificar que la cancha pertenece al complejo
        const field = await (prisma as any).field.findFirst({
            where: { id, complexId }
        })

        if (!field) {
            return NextResponse.json({ error: 'Cancha no encontrada o no pertenece a tu complejo' }, { status: 404 })
        }

        // Check subscription status
        const complex = await (prisma as any).complex.findUnique({
            where: { id: complexId }
        })

        if (!complex?.subscriptionActive) {
            return NextResponse.json({ error: 'Suscripción requerida' }, { status: 403 })
        }

        await (prisma as any).field.delete({
            where: { id }
        })
        return NextResponse.json({ message: 'Field deleted' })
    } catch (error) {
        console.error('Error deleting field:', error)
        return NextResponse.json({
            error: 'Error deleting field',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}

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
        const { name, type, price, imageUrl, availableDays, openTime, closeTime } = body

        // Verificar que la cancha pertenece al complejo
        const existingField = await (prisma as any).field.findFirst({
            where: { id, complexId }
        })

        if (!existingField) {
            return NextResponse.json({ error: 'Cancha no encontrada o no pertenece a tu complejo' }, { status: 404 })
        }

        // Check subscription status
        const complex = await (prisma as any).complex.findUnique({
            where: { id: complexId }
        })

        if (!complex?.subscriptionActive) {
            return NextResponse.json({ error: 'Suscripción requerida' }, { status: 403 })
        }

        const field = await (prisma as any).field.update({
            where: { id },
            data: {
                name,
                type: type ? String(type) : undefined,
                price: price ? parseFloat(price) : undefined,
                imageUrl,
                availableDays,
                openTime,
                closeTime
            }
        })

        return NextResponse.json(field)
    } catch (error) {
        console.error('Error updating field:', error)
        return NextResponse.json({ error: 'Error updating field', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
