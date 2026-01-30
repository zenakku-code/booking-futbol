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
                trialEndsAt: true,
                subscriptionActive: true,
                subscriptionDate: true
            }
        })

        if (!complex) {
            return NextResponse.json({ error: 'Complex not found' }, { status: 404 })
        }

        // Check if already has paid subscription
        if (complex.subscriptionDate) {
            return NextResponse.json({
                error: 'Ya tienes una suscripción paga activa'
            }, { status: 400 })
        }

        // Check if trial is currently active (not expired)
        const now = new Date()
        const hasActiveTrial = complex.trialEndsAt && new Date(complex.trialEndsAt) > now

        if (hasActiveTrial) {
            return NextResponse.json({
                error: 'Ya tienes un trial activo'
            }, { status: 400 })
        }

        // Activate 7-day trial (or reactivate if expired/disabled)
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 7)

        await prisma.complex.update({
            where: { id: session.complexId },
            data: {
                trialEndsAt: trialEndDate,
                subscriptionActive: true
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Trial de 7 días activado correctamente',
            trialEndsAt: trialEndDate
        })

    } catch (error) {
        console.error('Trial activation error:', error)
        return NextResponse.json({
            error: 'Error al activar el trial',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
