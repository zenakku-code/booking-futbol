import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership before deleting
        const key = await (prisma as any).apiKey.findUnique({
            where: { id }
        })

        if (!key || key.complexId !== complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        await (prisma as any).apiKey.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting key:', error)
        return NextResponse.json({ error: 'Error deleting key' }, { status: 500 })
    }
}
