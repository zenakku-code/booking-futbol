
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getSession()
        console.log('[STATS] Session:', session ? 'Found' : 'Null')

        // Ensure Super Admin
        const user = await prisma.user.findUnique({
            where: { email: session?.email || '' }
        })
        console.log('[STATS] User:', user?.email, 'Role:', user?.role)

        if (user?.role !== 'SUPERADMIN') {
            console.log('[STATS] Unauthorized access attempt')
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
        console.error('[STATS] API Error Detail:', error)
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
