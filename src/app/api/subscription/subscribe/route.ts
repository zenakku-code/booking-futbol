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
        // Check if already subscribed AND active
        const hasActiveSubscription = complex.subscriptionEndsAt && new Date(complex.subscriptionEndsAt) > new Date()

        if (hasActiveSubscription) {
            return NextResponse.json({
                error: 'Ya tienes una suscripción activa. Espera a que venza para renovar.'
            }, { status: 400 })
        }

        const { planType } = await request.json()

        if (!['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(planType)) {
            return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
        }

        // Pricing logic - Fetch from SystemConfig
        let monthlyPrice = 10000
        let quarterlyPrice = 27000
        let annualPrice = 100000

        try {
            const config = await prisma.systemConfig.findFirst({
                orderBy: { updatedAt: 'desc' }
            })
            if (config) {
                monthlyPrice = config.monthlyPrice
                quarterlyPrice = config.quarterlyPrice
                annualPrice = config.annualPrice
            }
        } catch (e) {
            console.error('Failed to fetch pricing config, using defaults', e)
        }

        const amount = planType === 'ANNUAL' ? annualPrice : (planType === 'QUARTERLY' ? quarterlyPrice : monthlyPrice)
        const days = planType === 'ANNUAL' ? 365 : (planType === 'QUARTERLY' ? 90 : 30)

        const now = new Date()
        // Calculate new expiration date
        // If already has active subscription, add to existing end date
        const newEndsAt = complex.subscriptionEndsAt && new Date(complex.subscriptionEndsAt) > now
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

        // Ensure we have a valid base URL for redirects
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'

        console.log('[SUBSCRIBE] BaseURL resolved to:', baseUrl)

        const preferenceBody = {
            items: [
                {
                    id: planType,
                    title: `Suscripción ${planType === 'ANNUAL' ? 'Anual' : (planType === 'QUARTERLY' ? 'Trimestral' : 'Mensual')} - TikiTaka`,
                    quantity: 1,
                    unit_price: amount,
                    currency_id: 'ARS'
                }
            ],
            external_reference: paymentRecord.id, // Link to our DB record
            back_urls: {
                success: `${baseUrl}/admin/subscription?status=success`,
                failure: `${baseUrl}/admin/subscription?status=failure`,
                pending: `${baseUrl}/admin/subscription?status=pending`
            },
            auto_return: 'approved',
            notification_url: `${baseUrl}/api/webhooks/mercadopago`
        }

        console.log('[SUBSCRIBE] Creating preference with back_urls:', preferenceBody.back_urls)

        const mpPreference = await preference.create({ body: preferenceBody })

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
