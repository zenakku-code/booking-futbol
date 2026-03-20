import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function GET() {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const complex = await (prisma as any).complex.findUnique({
            where: { id: complexId }
        })

        if (!complex) {
            return NextResponse.json({ error: 'Complejo no encontrado' }, { status: 404 })
        }

        return NextResponse.json({ complex })
    } catch (error: any) {
        return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { logoUrl, address, name, description, downPaymentFixed, downPaymentEnabled } = body

        // --- Security Validations ---
        if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
            return NextResponse.json({ error: 'Nombre inválido (máx 100 caracteres)' }, { status: 400 })
        }
        if (address !== undefined && (typeof address !== 'string' || address.length > 200)) {
            return NextResponse.json({ error: 'Dirección inválida (máx 200 caracteres)' }, { status: 400 })
        }
        if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
            return NextResponse.json({ error: 'Descripción inválida (máx 500 caracteres)' }, { status: 400 })
        }
        if (logoUrl !== undefined && typeof logoUrl === 'string' && logoUrl.length > 0) {
            // Allow https URLs or Base64 data URLs
            const isBase64 = logoUrl.startsWith('data:image/')
            const isHttps = logoUrl.startsWith('https://')
            
            if ((!isHttps && !isBase64) || logoUrl.length > 500000) { // Limit Base64 to ~500KB to be safe
                return NextResponse.json({ error: 'URL de logo inválida o demasiado pesada' }, { status: 400 })
            }
        }
        // Basic sanitization to prevent XSS in fields
        const sanitize = (str: string) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()

        const updatedComplex = await (prisma as any).complex.update({
            where: { id: complexId },
            data: {
                ...(logoUrl !== undefined && { logoUrl }),
                ...(address !== undefined && { address: sanitize(address) }),
                ...(name !== undefined && { name: sanitize(name) }),
                ...(description !== undefined && { description: sanitize(description) }),
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
