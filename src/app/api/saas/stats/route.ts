
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

        // Fetch System Config for MRR calculation
        const config = await prisma.systemConfig.findFirst()
        const monthlyPrice = config?.monthlyPrice || 10000
        const quarterlyPrice = config?.quarterlyPrice || 27000

        // Fetch Total Revenue from Snapshots
        const revenueAgg = await prisma.revenueSnapshot.aggregate({
            _sum: { amount: true }
        })
        const totalRevenue = revenueAgg._sum.amount || 0

        // Count Subscriptions with Grouping
        const subscriptionStats = await prisma.complex.groupBy({
            by: ['planType'],
            where: { subscriptionActive: true },
            _count: true
        })

        const activeMonthly = subscriptionStats.find(s => s.planType === 'MONTHLY')?._count || 0
        const activeQuarterly = subscriptionStats.find(s => s.planType === 'QUARTERLY')?._count || 0

        const activeTrial = await prisma.complex.count({
            where: {
                subscriptionActive: true,
                planType: null,
                trialEndsAt: { gt: new Date() }
            }
        })

        // MRR Calculation (Monthly Recurring Revenue)
        const mrr = (activeMonthly * monthlyPrice) + (activeQuarterly * (quarterlyPrice / 3))

        // Conversion Calculation
        const totalComplexes = await prisma.complex.count()
        const conversionRate = totalComplexes > 0 
            ? ((activeMonthly + activeQuarterly) / totalComplexes) * 100 
            : 0

        return NextResponse.json({
            revenue: totalRevenue,
            mrr: mrr,
            conversionRate: conversionRate,
            subscriptions: {
                monthly: activeMonthly,
                quarterly: activeQuarterly,
                trial: activeTrial,
                total: activeMonthly + activeQuarterly
            },
            growth: {
                lastMonth: 12, // Placeholder for historical comparison
                thisMonth: activeMonthly + activeQuarterly
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
