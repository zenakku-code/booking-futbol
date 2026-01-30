import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const fieldId = searchParams.get('fieldId')
        const date = searchParams.get('date')

        // Security check: Must provide fieldId for public availability check
        if (!fieldId) {
            return NextResponse.json({ error: 'fieldId is required parameter for public query' }, { status: 400 })
        }

        const where: any = { fieldId }

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

        // Security: Sanitize sensitive data for public view
        const currentComplexId = await getComplexId()

        const sanitizedBookings = bookings.map(b => {
            const isOwner = currentComplexId && (b.field as any).complexId === currentComplexId

            if (isOwner) return b

            // Public View: Strict sanitization - whitelist fields
            return {
                id: b.id,
                fieldId: b.fieldId,
                date: b.date,
                startTime: b.startTime,
                endTime: b.endTime,
                status: b.status,
                clientName: 'Reservado', // Hide real names
                // Explicitly excluding other sensitive fields
            }
        })

        return NextResponse.json(sanitizedBookings)
    } catch (error) {
        console.error('Error fetching bookings:', error)
        return NextResponse.json({ error: 'Error fetching bookings' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        // 1. Rate Limiting Protection (Anti-Spam)
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'

        // Limit: 5 bookings per minute per IP
        if (!rateLimit(ip, 5, 60000)) {
            console.warn(`[Security] Rate limit exceeded for IP: ${ip}`)
            return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }, { status: 429 })
        }

        const body = await request.json()
        const { fieldId, date, startTime, endTime, totalPrice, items = [], paymentType = 'FULL' } = body
        // Mutable variables for sanitization
        let { clientName, clientPhone } = body

        if (!fieldId || !date || !startTime || !endTime || !clientName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 2. Input Sanitization (Anti-XSS & Data Integrity)
        clientName = typeof clientName === 'string' ? clientName.replace(/[<>]/g, '').trim().slice(0, 100) : 'Cliente'
        clientPhone = clientPhone && typeof clientPhone === 'string' ? clientPhone.replace(/[^\d\+\-\s]/g, '').slice(0, 20) : null

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
                    status: 'pending',
                    paymentType // Guardo el tipo de pago
                } as any
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

        let paymentUrl = null
        // Fix trailing slash in base url if exists
        const baseUrlRaw = process.env.NEXT_PUBLIC_BASE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
        const baseUrl = baseUrlRaw.replace(/\/$/, '')

        if (paymentType === 'SPLIT') {
            // Generar link interno para la página de pago dividido
            paymentUrl = `${baseUrl}/pay/${booking.id}`
        } else {
            // Mercado Pago Integration FULL PAYMENT
            const account = await prisma.account.findFirst({
                where: { complexId: (field as any).complexId } as any
            })

            if (account && account.accessToken) {
                try {
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
                            external_reference: booking.id,
                            notification_url: `${baseUrl}/api/webhooks/mercadopago?complexId=${(field as any).complexId}`
                        })
                    })

                    const preference = await preferenceRes.json()
                    if (preference.init_point) {
                        paymentUrl = preference.init_point
                    } else {
                        console.error('MP Preference Init Error', preference)
                    }
                } catch (error) {
                    console.error('MP Preference Error', error)
                }
            }
        }

        return NextResponse.json({ ...booking, paymentUrl })
    } catch (error) {
        console.error('POST /bookings Error:', error)
        return NextResponse.json({ error: 'Error creating booking' }, { status: 500 })
    }
}
