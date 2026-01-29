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
        const { fieldId, date, startTime, endTime, clientName, clientPhone, totalPrice, items = [] } = body

        if (!fieldId || !date || !startTime || !endTime || !clientName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate overlap
        const overlappingBooking = await prisma.booking.findFirst({
            where: {
                fieldId,
                date: new Date(date),
                status: { not: 'cancelled' },
                OR: [
                    { startTime: { lte: startTime }, endTime: { gt: startTime } },
                    { startTime: { lt: endTime }, endTime: { gte: endTime } },
                    { startTime: { gte: startTime }, endTime: { lte: endTime } }
                ]
            }
        })

        if (overlappingBooking) {
            return NextResponse.json({ error: 'El horario seleccionado ya está ocupado (solapamiento)' }, { status: 409 })
        }

        const field = await prisma.field.findUnique({
            where: { id: fieldId },
            include: { complex: true } as any
        })
        if (!field) return NextResponse.json({ error: 'Field not found' }, { status: 404 })

        const isWithinHours = startTime >= field.openTime && endTime <= field.closeTime
        if (!isWithinHours) {
            return NextResponse.json({ error: 'El horario seleccionado está fuera de rango de apertura de la cancha' }, { status: 400 })
        }

        // Use transaction for Booking, BookingItems, and Stock update
        const booking = await prisma.$transaction(async (tx) => {
            const b = await tx.booking.create({
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

            // Create BookingItems and Update Stock
            for (const item of items) {
                const invItem = await (tx as any).inventoryItem.findUnique({ where: { id: item.id } })
                if (invItem && invItem.stock >= item.quantity) {
                    await (tx as any).bookingItem.create({
                        data: {
                            bookingId: b.id,
                            inventoryItemId: item.id,
                            quantity: item.quantity,
                            priceAtBooking: invItem.price
                        }
                    })
                    // Decrement stock
                    await (tx as any).inventoryItem.update({
                        where: { id: item.id },
                        data: { stock: { decrement: item.quantity } }
                    })
                }
            }

            return b
        })

        // Mercado Pago Integration
        const account = await prisma.account.findFirst({
            where: { complexId: (field as any).complexId } as any
        })

        let paymentUrl = null

        if (account && account.accessToken) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

                const returnPath = (field as any).complex?.slug ? `/${(field as any).complex.slug}` : ''

                // Build MP items array
                const mpItems = [{
                    title: `Reserva Cancha - ${date}`,
                    quantity: 1,
                    currency_id: 'ARS',
                    unit_price: field.price
                }]

                // Add inventory items to MP
                for (const item of items) {
                    const invItem = await (prisma as any).inventoryItem.findUnique({ where: { id: item.id } })
                    if (invItem && item.quantity > 0) {
                        mpItems.push({
                            title: invItem.name,
                            quantity: item.quantity,
                            currency_id: 'ARS',
                            unit_price: invItem.price
                        })
                    }
                }

                const preferenceRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${account.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        items: mpItems,
                        back_urls: {
                            success: `${baseUrl}${returnPath}?status=success&booking_id=${booking.id}`,
                            failure: `${baseUrl}${returnPath}?status=failure&booking_id=${booking.id}`,
                            pending: `${baseUrl}${returnPath}?status=pending&booking_id=${booking.id}`
                        },
                        auto_return: 'approved',
                        external_reference: booking.id
                    })
                })

                const preference = await preferenceRes.json()
                if (preference.init_point) {
                    paymentUrl = preference.init_point
                }
            } catch (error) {
                console.error('MP Preference Error', error)
            }
        }

        return NextResponse.json({ ...booking, paymentUrl })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating booking' }, { status: 500 })
    }
}
