
import { NextResponse } from 'next/server'
import { payment } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const url = new URL(request.url)
        console.log('[WEBHOOK] Received MP notification')

        // MP sends notification details in query params or body depending on version
        // Usually topic=payment&id=123 or type=payment&data.id=123
        const searchParams = url.searchParams
        const type = searchParams.get('type') || (await request.json()).type

        let paymentId = searchParams.get('data.id')
        if (!paymentId) {
            // Try body
            const body = await request.clone().json().catch(() => ({}))
            paymentId = body.data?.id
        }

        console.log(`[WEBHOOK] Type: ${type}, ID: ${paymentId}`)

        if (type === 'payment' && paymentId) {
            // Fetch payment status from MP
            const paymentData = await payment.get({ id: paymentId })

            console.log(`[WEBHOOK] Payment Status: ${paymentData.status} | External ref: ${paymentData.external_reference}`)

            if (paymentData.status === 'approved') {
                const externalRef = paymentData.external_reference
                const metadata = paymentData.metadata || {}

                console.log(`[WEBHOOK] Metadata:`, metadata)

                // CASE 1: Booking Payment (Split or Full)
                if (metadata.type === 'split_payment' || metadata.booking_id) {
                    console.log('[WEBHOOK] Processing Booking Payment...')
                    // 1. Update Payment Record
                    await prisma.payment.update({
                        where: { id: externalRef },
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
                    const days = payRecord.planType === 'QUARTERLY' ? 90 : 30

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
