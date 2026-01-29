import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const fieldId = searchParams.get('fieldId')
        const date = searchParams.get('date')

        const where: any = {}
        if (fieldId) where.fieldId = fieldId
        // Date filtering can be complex with timezones, simpler for now:
        // If date provided, filter by day approximate or exact match?
        // Let's assume frontend sends ISO date start of day or we fetch all and filter in client for mvp,
        // OR just fetch all bookings for a field.
        // Efficient way:
        if (date) {
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(date)
            endOfDay.setHours(23, 59, 59, 999)
            where.date = {
                gte: startOfDay,
                lte: endOfDay
            }
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: { field: true },
            orderBy: { date: 'asc' }
        })
        return NextResponse.json(bookings)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching bookings' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { fieldId, date, startTime, endTime, clientName, clientPhone, totalPrice } = body

        if (!fieldId || !date || !startTime || !endTime || !clientName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // TODO: Validate availability?
        // Robust overlap check
        const overlappingBooking = await prisma.booking.findFirst({
            where: {
                fieldId,
                date: new Date(date),
                status: { not: 'cancelled' },
                OR: [
                    {
                        // New booking starts during an existing one
                        startTime: { lte: startTime },
                        endTime: { gt: startTime }
                    },
                    {
                        // New booking ends during an existing one
                        startTime: { lt: endTime },
                        endTime: { gte: endTime }
                    },
                    {
                        // Existing booking is entirely inside new one
                        startTime: { gte: startTime },
                        endTime: { lte: endTime }
                    }
                ]
            }
        })

        if (overlappingBooking) {
            return NextResponse.json({ error: 'El horario seleccionado ya está ocupado (solapamiento)' }, { status: 409 })
        }

        // Validate within field hours
        const field = await prisma.field.findUnique({ where: { id: fieldId } })
        if (!field) return NextResponse.json({ error: 'Field not found' }, { status: 404 })

        const isWithinHours = startTime >= field.openTime && endTime <= field.closeTime
        if (!isWithinHours) {
            return NextResponse.json({ error: 'El horario seleccionado está fuera de rango de apertura de la cancha' }, { status: 400 })
        }

        const booking = await prisma.booking.create({
            data: {
                fieldId,
                date: new Date(date),
                startTime,
                endTime,
                clientName,
                clientPhone,
                totalPrice: parseFloat(totalPrice),
                status: 'pending'
            }
        })

        // Mercado Pago Integration
        const account = await prisma.account.findFirst({
            where: { provider: 'mercadopago' }
        })

        let paymentUrl = null

        if (account && account.accessToken) {
            try {
                console.log('Using MP Access Token:', account.accessToken.substring(0, 15) + '...')

                // Get base URL from environment or request
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000'

                const preferenceRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${account.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        items: [
                            {
                                title: `Reserva Cancha - ${date}`,
                                quantity: 1,
                                currency_id: 'ARS',
                                unit_price: parseFloat(totalPrice)
                            }
                        ],
                        back_urls: {
                            success: `${baseUrl}/?status=success&booking_id=${booking.id}`,
                            failure: `${baseUrl}/?status=failure&booking_id=${booking.id}`,
                            pending: `${baseUrl}/?status=pending&booking_id=${booking.id}`
                        },
                        auto_return: 'approved',
                        external_reference: booking.id
                    })
                })

                const preference = await preferenceRes.json()
                if (preference.init_point) {
                    paymentUrl = preference.init_point
                } else {
                    console.error('MP Preference Error:', preference)
                }
            } catch (error) {
                console.error('CRITICAL: Error creating MP preference', error)
            }
        } else {
            console.warn('MP Integration skipped: No account or access token found.')
        }

        return NextResponse.json({ ...booking, paymentUrl })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating booking' }, { status: 500 })
    }
}
