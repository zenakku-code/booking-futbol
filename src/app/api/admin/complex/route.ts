import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function PATCH(request: Request) {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { logoUrl, address, name } = body

        const updatedComplex = await prisma.complex.update({
            where: { id: complexId },
            data: {
                ...(logoUrl !== undefined && { logoUrl }),
                ...(address !== undefined && { address }),
                ...(name !== undefined && { name }),
            }
        })

        return NextResponse.json({ success: true, complex: updatedComplex })
    } catch (error) {
        console.error('Error updating complex:', error)
        return NextResponse.json({ error: 'Error al actualizar los datos del complejo' }, { status: 500 })
    }
}
