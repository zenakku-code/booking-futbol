import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
    try {
        const session = await getSession()

        if (!session || !session.complexId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get current complex
        const complex = await prisma.complex.findUnique({
            where: { id: session.complexId },
            select: {
                id: true,
                subscriptionDate: true
            }
        })

        if (!complex) {
            return NextResponse.json({ error: 'Complex not found' }, { status: 404 })
        }

        // Check if already subscribed
        if (complex.subscriptionDate) {
            return NextResponse.json({
                error: 'Ya tienes una suscripción activa'
            }, { status: 400 })
        }

        // TODO: Integrate with payment provider (Stripe, MercadoPago, etc.)
        // For now, we'll just mark as subscribed (MVP)

        await prisma.complex.update({
            where: { id: session.complexId },
            data: {
                subscriptionActive: true,
                subscriptionDate: new Date(),
                trialEndsAt: null  // Remove trial limitation
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Suscripción activada correctamente',
            subscriptionDate: new Date()
        })

    } catch (error) {
        console.error('Subscription error:', error)
        return NextResponse.json({
            error: 'Error al activar la suscripción',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
