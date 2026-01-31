import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
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

        const { planType } = await request.json()

        if (!['MONTHLY', 'QUARTERLY'].includes(planType)) {
            return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
        }

        // Pricing logic (can be moved to config)
        const amount = planType === 'QUARTERLY' ? 27000 : 10000
        const days = planType === 'QUARTERLY' ? 90 : 30

        const now = new Date()
        // Calculate new expiration date
        // If already has active subscription, add to existing end date
        let newEndsAt = complex.subscriptionEndsAt && new Date(complex.subscriptionEndsAt) > now
            ? new Date(complex.subscriptionEndsAt)
            : new Date()

        newEndsAt.setDate(newEndsAt.getDate() + days)

        // 1. Create Payment Record
        const payment = await prisma.subscriptionPayment.create({
            data: {
                complexId: session.complexId,
                amount: amount,
                planType: planType,
                status: 'approved', // Auto-approve for now (MVP)
                externalId: `manual_${Date.now()}`
            }
        })

        // 2. Update Complex
        await prisma.complex.update({
            where: { id: session.complexId },
            data: {
                subscriptionActive: true,
                subscriptionDate: complex.subscriptionDate || new Date(), // Keep original date if exists
                subscriptionEndsAt: newEndsAt,
                planType: planType,
                trialEndsAt: null // Remove trial limitation
            }
        })

        return NextResponse.json({
            success: true,
            message: `Suscripción ${planType === 'QUARTERLY' ? 'Trimestral' : 'Mensual'} activada`,
            subscriptionEndsAt: newEndsAt,
            planType: planType
        })

    } catch (error) {
        console.error('Subscription error:', error)
        return NextResponse.json({
            error: 'Error al activar la suscripción',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
