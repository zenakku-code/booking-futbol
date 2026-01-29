import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { bookingId, amount } = body

        if (!bookingId || !amount) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { field: true }
        })

        if (!booking) {
            return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
        }

        if (booking.status === 'confirmed' || booking.status === 'approved' || booking.status === 'cancelled') {
            return NextResponse.json({ error: 'Esta reserva ya está confirmada o finalizada.' }, { status: 400 })
        }

        // Crear Payment (casting a any por si types no refrescaron)
        const payment = await (prisma as any).payment.create({
            data: {
                amount: parseFloat(amount),
                bookingId,
                status: 'pending'
            }
        })

        // Buscar cuenta de Mercado Pago del complejo
        const complexId = (booking.field as any).complexId;
        const account = await prisma.account.findFirst({
            where: { complexId } as any
        })

        // Fake success in Development if no MP account but 'dummy' mode?
        // No, let's allow it to fail or mock it if strictly needed. 
        // But the user probably has MP account configured in DB or wants to test logic.

        if (!account || !account.accessToken) {
            // Fallback for demo/testing without real MP account on Complex
            // If we are in dev mode, maybe simulate success URL directly?
            // For now, return error to be strict.
            return NextResponse.json({ error: 'El complejo no tiene Mercado Pago configurado' }, { status: 400 })
        }

        // URL base
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        // Crear preferencia
        const preferenceRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${account.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: [{
                    title: `Pago parcial - ${booking.field.name}`,
                    quantity: 1,
                    currency_id: 'ARS',
                    unit_price: parseFloat(amount)
                }],
                payer: {
                    email: 'test_user_123456@testuser.com' // Placeholder required by some MP integrations
                },
                back_urls: {
                    success: `${baseUrl}/api/payments/confirm_mock?payment_id=${payment.id}&booking_id=${bookingId}`, // Truco para cerrar el ciclo sin webhook real en localhost
                    failure: `${baseUrl}/pay/${bookingId}?status=failure`,
                    pending: `${baseUrl}/pay/${bookingId}?status=pending`
                },
                auto_return: 'approved',
                external_reference: payment.id, // OJO: Usamos payment.id como referencia principal
                metadata: {
                    booking_id: bookingId,
                    payment_id: payment.id,
                    type: 'split_payment'
                }
            })
        })

        const preference = await preferenceRes.json()

        if (preference.init_point) {
            // Guardar externalId (preference id)
            await (prisma as any).payment.update({
                where: { id: payment.id },
                data: { externalId: preference.id }
            })

            return NextResponse.json({ url: preference.init_point })
        } else {
            console.error('MP Error', preference)
            return NextResponse.json({ error: 'Error al conectar con Mercado Pago' }, { status: 500 })
        }

    } catch (error) {
        console.error('Payment Create Error:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
