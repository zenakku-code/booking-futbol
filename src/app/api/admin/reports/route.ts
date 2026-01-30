import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const complexId = await getComplexId()
        if (!complexId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        if (!from || !to) {
            return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
        }

        const startDate = new Date(from)
        const endDate = new Date(to)
        endDate.setHours(23, 59, 59, 999)

        // 1. Fetch all bookings in range
        const bookings = await (prisma as any).booking.findMany({
            where: {
                field: { complexId },
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                field: true,
                payments: { where: { status: 'approved' } },
                items: { include: { inventoryItem: true } }
            }
        })

        // 2. Summary stats
        const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed')
        const totalRevenue = confirmedBookings.reduce((acc: number, b: any) => acc + b.totalPrice, 0)

        // Calculate actually collected money (approved payments)
        const actualCollected = bookings.reduce((acc: number, b: any) => {
            const bookingPayments = b.payments.reduce((pAcc: number, p: any) => pAcc + p.amount, 0)
            return acc + bookingPayments + (b.paidAmount || 0)
        }, 0)

        // 3. Revenue by Field
        const revenueByField: Record<string, { name: string, amount: number, count: number }> = {}
        confirmedBookings.forEach((b: any) => {
            if (!revenueByField[b.fieldId]) {
                revenueByField[b.fieldId] = { name: b.field.name, amount: 0, count: 0 }
            }
            revenueByField[b.fieldId].amount += b.totalPrice
            revenueByField[b.fieldId].count += 1
        })

        // 4. Daily Revenue for Chart
        const dailyRevenue: Record<string, number> = {}
        confirmedBookings.forEach((b: any) => {
            const dayKey = new Date(b.date).toLocaleDateString('en-CA') // YYYY-MM-DD
            dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + b.totalPrice
        })

        // 5. Items breakdown
        const itemsBreakdown: Record<string, { name: string, amount: number, quantity: number }> = {}
        confirmedBookings.forEach((b: any) => {
            b.items.forEach((item: any) => {
                const itemName = item.inventoryItem.name
                if (!itemsBreakdown[itemName]) {
                    itemsBreakdown[itemName] = { name: itemName, amount: 0, quantity: 0 }
                }
                itemsBreakdown[itemName].amount += item.priceAtBooking * item.quantity
                itemsBreakdown[itemName].quantity += item.quantity
            })
        })

        return NextResponse.json({
            summary: {
                totalBookings: bookings.length,
                confirmedBookings: confirmedBookings.length,
                totalRevenue,
                actualCollected,
                averageTicket: confirmedBookings.length > 0 ? totalRevenue / confirmedBookings.length : 0
            },
            revenueByField: Object.values(revenueByField),
            dailyRevenue,
            itemsBreakdown: Object.values(itemsBreakdown)
        })

    } catch (error) {
        console.error('Report API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
