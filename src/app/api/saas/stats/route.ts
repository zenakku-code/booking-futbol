
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getSession()

        // Ensure Super Admin
        const user = await prisma.user.findUnique({
            where: { email: session?.email || '' }
        })

        if (user?.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Calculate Total Revenue from SubscriptionPayment (approved)
        const totalRevenue = await prisma.subscriptionPayment.aggregate({
            where: { status: 'approved' },
            _sum: { amount: true }
        })

        // Count Active Subscriptions by Plan (using Complex current plan logic or active payments?)
        // Better to count current active subscriptions in Complex
        const activeMonthly = await prisma.complex.count({
            where: {
                subscriptionActive: true,
                planType: 'MONTHLY',
                // subscriptionEndsAt: { gt: new Date() } // Optional: strict count
            }
        })

        const activeQuarterly = await prisma.complex.count({
            where: {
                subscriptionActive: true,
                planType: 'QUARTERLY'
            }
        })

        return NextResponse.json({
            revenue: totalRevenue._sum.amount || 0,
            subscriptions: {
                monthly: activeMonthly,
                quarterly: activeQuarterly,
                total: activeMonthly + activeQuarterly
            }
        })

    } catch (error) {
        console.error('Stats API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
