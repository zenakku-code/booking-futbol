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
        // Get current complex
        const complex = await prisma.complex.findUnique({
            where: { id: session.complexId },
            select: {
                id: true,
                subscriptionDate: true,
                subscriptionEndsAt: true
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

        // Pricing logic - Fetch from SystemConfig
        let monthlyPrice = 10000
        let quarterlyPrice = 27000

        try {
            const config = await prisma.systemConfig.findFirst({
                orderBy: { updatedAt: 'desc' }
            })
            if (config) {
                monthlyPrice = config.monthlyPrice
                quarterlyPrice = config.quarterlyPrice
            }
        } catch (e) {
            console.error('Failed to fetch pricing config, using defaults', e)
        }

        const amount = planType === 'QUARTERLY' ? quarterlyPrice : monthlyPrice
        const days = planType === 'QUARTERLY' ? 90 : 30

        const now = new Date()
        // Calculate new expiration date
        // If already has active subscription, add to existing end date
        let newEndsAt = complex.subscriptionEndsAt && new Date(complex.subscriptionEndsAt) > now
            ? new Date(complex.subscriptionEndsAt)
            : new Date()

        newEndsAt.setDate(newEndsAt.getDate() + days)

        // 1. Create Pending Payment Record
        const paymentRecord = await prisma.subscriptionPayment.create({
            data: {
                complexId: session.complexId,
                amount: amount,
                planType: planType,
                status: 'pending', // Pending payment
                externalId: null // Will update with MP Preference ID? Or just link via external_reference
            }
        })

        // 2. Create MP Preference
        // Import preference from lib/mercadopago (Need to import it at top)
        const { preference } = await import('@/lib/mercadopago')

        const mpPreference = await preference.create({
            body: {
                items: [
                    {
                        id: planType,
                        title: `Suscripción ${planType === 'QUARTERLY' ? 'Trimestral' : 'Mensual'} - Booking Futbol`,
                        quantity: 1,
                        unit_price: amount,
                        currency_id: 'ARS'
                    }
                ],
                external_reference: paymentRecord.id, // Link to our DB record
                back_urls: {
                    success: `${request.headers.get('origin')}/admin/subscription?status=success`,
                    failure: `${request.headers.get('origin')}/admin/subscription?status=failure`,
                    pending: `${request.headers.get('origin')}/admin/subscription?status=pending`
                },
                auto_return: 'approved',
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/api/webhooks/mercadopago`
            }
        })

        // Update record with preference ID (optional, or just rely on external_reference)
        await prisma.subscriptionPayment.update({
            where: { id: paymentRecord.id },
            data: { externalId: mpPreference.id }
        })

        return NextResponse.json({
            success: true,
            init_point: mpPreference.init_point, // Redirect URL
            sandbox_init_point: mpPreference.sandbox_init_point
        })

    } catch (error) {
        console.error('Subscription error:', error)
        return NextResponse.json({
            error: 'Error al generar el pago',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
