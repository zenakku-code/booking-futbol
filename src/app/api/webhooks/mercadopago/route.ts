
import { NextResponse } from 'next/server'
import { payment, preference } from '@/lib/mercadopago' // Platform client fallback
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import MercadoPagoConfig, { Payment } from 'mercadopago'

// Utility to validate MP webhook signature
function validateSignature(request: Request, bodyText: string): boolean {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')

    // Si no enviamos ts en x-signature, MP lo hace a veces. Ideal check for both:
    if (!xSignature || !xRequestId) {
        console.warn('[WEBHOOK] Missing signature headers')
        // En desarooollo a veces no llegan. Deberíamos forzarlo en Prod
        if (process.env.NODE_ENV === 'production') return false;
        return true;
    }

    const mpWebhookSecret = process.env.MP_WEBHOOK_SECRET
    if (!mpWebhookSecret) {
        console.error('[WEBHOOK] MP_WEBHOOK_SECRET not configured')
        return process.env.NODE_ENV !== 'production';
    }

    try {
        const parts = xSignature.split(',')
        let ts = ''
        let v1 = ''

        parts.forEach(part => {
            const [key, value] = part.split('=')
            if (key === 'ts') ts = value
            if (key === 'v1') v1 = value
        })

        const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`
        const hmac = crypto.createHmac('sha256', mpWebhookSecret)

        const digest = hmac.update(manifest).digest('hex')
        return digest === v1
    } catch (e) {
        console.error('[WEBHOOK] Signature validation error', e)
        return false
    }
}

export async function POST(request: Request) {
    try {
        const url = new URL(request.url)
        console.log('[WEBHOOK] Received MP notification')

        const bodyText = await request.text() // Read raw text for signature

        // 1. Validate Signature
        if (!validateSignature(request, bodyText)) {
            console.error('[WEBHOOK] Invalid signature or missing headers')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
        }

        // MP sends notification details in query params or body depending on version
        const searchParams = url.searchParams
        const type = searchParams.get('type') || (JSON.parse(bodyText)).type

        let paymentId = searchParams.get('data.id')
        if (!paymentId) {
            // Try body
            const body = JSON.parse(bodyText)
            paymentId = body.data?.id
        }

        console.log(`[WEBHOOK] Type: ${type}, ID: ${paymentId}`)

        if (type === 'payment' && paymentId) {
            // Check if there is a complexId in query string (from our custom notification_url in create/route.ts)
            const complexId = searchParams.get('complexId')

            let mpPaymentClient = payment; // default to platform client (for subscriptions)

            // If complexId provided, we are dealing with a tenant's Booking payment. Configure custom client.
            if (complexId) {
                const account = await prisma.account.findFirst({ where: { complexId } })
                if (account?.accessToken) {
                    const tenantClient = new MercadoPagoConfig({ accessToken: account.accessToken });
                    mpPaymentClient = new Payment(tenantClient);
                } else {
                    console.error(`[WEBHOOK] Account not found or missing accessToken for complex ${complexId}`)
                    return NextResponse.json({ error: 'Tenant MP config not found' }, { status: 404 })
                }
            }

            // Fetch payment status from MP using the CORRECT client (Tenant vs Platform)
            const paymentData = await mpPaymentClient.get({ id: paymentId })

            console.log(`[WEBHOOK] Payment Status: ${paymentData.status} | External ref: ${paymentData.external_reference}`)

            if (paymentData.status === 'approved') {
                const externalRef = paymentData.external_reference
                const metadata = paymentData.metadata || {}

                console.log(`[WEBHOOK] Metadata:`, metadata)

                // CASE 1: Booking Payment (Split or Full)
                if (metadata.type === 'split_payment' || metadata.booking_id) {
                    console.log('[WEBHOOK] Processing Booking Payment...')
                    // 1. Update Payment Record
                    await prisma.payment.updateMany({ // Use updateMany because id could be string or internal uuid vs externalId depending on how it was saved
                        where: { OR: [{ id: externalRef }, { externalId: externalRef }, { externalId: String(paymentData.id) }] },
                        data: { status: 'approved', externalId: String(paymentData.id) }
                    })

                    // 2. Update Booking Status (Simple logic: Mark approved)
                    // In a real split system, we would sum all payments. For now, we assume 1 payment = confirm.
                    await prisma.booking.update({
                        where: { id: metadata.booking_id },
                        data: { status: 'confirmed' }
                    })

                    console.log(`[WEBHOOK] Booking ${metadata.booking_id} confirmed!`)

                }
                // CASE 2: Subscription Payment (Default fallback)
                else {
                    const subscriptionPaymentId = externalRef
                    if (!subscriptionPaymentId) {
                        console.error('[WEBHOOK] Missing external_reference')
                        return NextResponse.json({ status: 'ok' })
                    }

                    // 1. Update Payment Record
                    const payRecord = await prisma.subscriptionPayment.update({
                        where: { id: subscriptionPaymentId },
                        data: {
                            status: 'approved',
                            externalId: String(paymentData.id)
                        },
                        include: { complex: true }
                    })

                    const complex = payRecord.complex
                    const now = new Date()

                    // Calculate new end date based on Plan Type
                    const days = payRecord.planType === 'ANNUAL' ? 365 : (payRecord.planType === 'QUARTERLY' ? 90 : 30)

                    const newEndsAt = complex.subscriptionEndsAt && new Date(complex.subscriptionEndsAt) > now
                        ? new Date(complex.subscriptionEndsAt)
                        : new Date()

                    newEndsAt.setDate(newEndsAt.getDate() + days)

                    // 2. Activate Subscription
                    await prisma.complex.update({
                        where: { id: complex.id },
                        data: {
                            subscriptionActive: true,
                            subscriptionDate: complex.subscriptionDate || new Date(),
                            subscriptionEndsAt: newEndsAt,
                            planType: payRecord.planType,
                            trialEndsAt: null
                        }
                    })

                    console.log(`[WEBHOOK] Activated subscription for complex ${complex.id}`)
                }
            }
        }

        return NextResponse.json({ status: 'ok' })

    } catch (error) {
        console.error('[WEBHOOK] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
