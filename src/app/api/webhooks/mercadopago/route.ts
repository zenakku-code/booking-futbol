import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const url = new URL(request.url)
        console.log(`Webhook received at: ${url.toString()}`)

        // Params de URL
        const complexId = url.searchParams.get('complexId')
        const topic = url.searchParams.get('topic') || url.searchParams.get('type')

        // Body (MP manda JSON)
        const body = await request.json().catch(() => ({}))
        console.log('Webhook Payload:', JSON.stringify(body, null, 2))

        const notificationType = body?.type || topic || body?.topic

        // MP sometimes sends 'data.id' or jus 'id' in resource
        const mpPaymentId = body?.data?.id || body?.id

        // Si no es un payment, ignoramos (ej: subscription notification, test)
        if (notificationType !== 'payment') {
            console.log(`Ignored type: ${notificationType}`)
            return NextResponse.json({ status: 'ignored' })
        }

        if (!mpPaymentId || !complexId) {
            console.error('Missing payment data or complexId')
            return NextResponse.json({ error: 'Missing data' }, { status: 400 })
        }

        // 1. Obtener credenciales del complejo para validar
        const account = await prisma.account.findFirst({
            where: { complexId: complexId } as any
        })

        if (!account?.accessToken) {
            console.error(`No credentials for complex ${complexId}`)
            return NextResponse.json({ error: 'Complex credentials not found' }, { status: 500 })
        }

        // 2. Verificar estado real en MP (Anti-Fraude)
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
            headers: {
                'Authorization': `Bearer ${account.accessToken}`
            }
        })

        if (!mpRes.ok) {
            console.error('Error fetching payment from MP', await mpRes.text())
            // Puede ser que el ID sea inválido o el token expiró.
            return NextResponse.json({ error: 'MP API Error' }, { status: 502 })
        }

        const paymentData = await mpRes.json()
        const status = paymentData.status // approved, rejected, pending, in_process
        console.log(`Payment ${mpPaymentId} status is: ${status}`)

        // 3. Buscar referencia interna
        // Usamos external_reference como link directo a nuestro Payment ID
        const internalPaymentId = paymentData.external_reference || paymentData.metadata?.payment_id

        if (!internalPaymentId) {
            console.warn('Payment without internal reference', mpPaymentId)
            // Si no tiene referencia nuestra, no podemos asociarlo.
            return NextResponse.json({ status: 'ok', msg: 'No internal reference' })
        }

        // 4. Actualizar Payment en DB local
        const updatedPayment = await (prisma as any).payment.update({
            where: { id: internalPaymentId },
            data: {
                status: status
            }
        })
        console.log(`Updated internal payment ${internalPaymentId} to ${status}`)

        // 5. Verificar si la reserva se completa (Booking Logic)
        if (status === 'approved') {
            const bookingId = updatedPayment.bookingId

            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { payments: true } // Traer todos los pagos
            })

            if (booking) {
                // Sumar todos los pagos aprobados
                const totalPaid = booking.payments
                    .filter((p: any) => p.status === 'approved')
                    .reduce((sum: number, p: any) => sum + p.amount, 0)

                // Sumar pagos legacy/manuales
                const grandTotal = totalPaid + (booking.paidAmount || 0)
                const remaining = booking.totalPrice - grandTotal

                // Si falta muy poco (margen $10 por si acaso), confirmar
                if (remaining <= 10) {
                    await prisma.booking.update({
                        where: { id: bookingId },
                        data: { status: 'confirmed' }
                    })
                    console.log(`Booking ${bookingId} FULLY PAID and CONFIRMED via Webhook! 🐄✅`)
                }
            }
        }

        return NextResponse.json({ status: 'ok' })

    } catch (error) {
        console.error('Webhook Critical Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
