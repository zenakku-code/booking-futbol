import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    const bookingId = searchParams.get('booking_id')

    // Simula la confirmación inmediata del pago al volver de MP
    if (paymentId) {
        try {
            await (prisma as any).payment.update({
                where: { id: paymentId },
                data: { status: 'approved' }
            })

            // También podríamos actualizar paidAmount en Booking aquí para consistencia rápida,
            // aunque el cálculo en la página lo hace dinámicamente sumando payments.

        } catch (e) {
            console.error('Error confirming payment mock', e)
        }
    }

    // Redirigir a la landing de la vaquita
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    return NextResponse.redirect(`${baseUrl}/pay/${bookingId}`)
}
