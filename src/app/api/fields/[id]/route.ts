import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Handling async params (Next.js 15)
) {
    try {
        const { id } = await params
        await prisma.field.delete({
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
        const { id } = await params
        const body = await request.json()
        const { name, type, price, imageUrl, availableDays, openTime, closeTime } = body

        const field = await prisma.field.update({
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
