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
        const { logoUrl, address, name, downPaymentFixed, downPaymentEnabled } = body

        const updatedComplex = await (prisma as any).complex.update({
            where: { id: complexId },
            data: {
                ...(logoUrl !== undefined && { logoUrl }),
                ...(address !== undefined && { address }),
                ...(name !== undefined && { name }),
                ...(downPaymentFixed !== undefined && { downPaymentFixed: Number(downPaymentFixed) }),
                ...(downPaymentEnabled !== undefined && { downPaymentEnabled }),
            }
        })

        return NextResponse.json({ success: true, complex: updatedComplex })
    } catch (error: any) {
        console.error('Error updating complex - Full Details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
        })
        return NextResponse.json({
            error: 'Error al actualizar los datos del complejo',
            details: error.message
        }, { status: 500 })
    }
}
