
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getSession()

    if (!session || !session.complexId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const complex = await prisma.complex.findUnique({
            where: { id: session.complexId },
            select: {
                isActive: true,
                subscriptionActive: true,
                trialEndsAt: true,
                subscriptionDate: true,
                subscriptionEndsAt: true,
                planType: true
            }
        })

        if (!complex) {
            return NextResponse.json({ error: 'Complex not found' }, { status: 404 })
        }

        const now = new Date()
        const isTrial = !!complex.trialEndsAt

        // Trial logic
        const trialActive = isTrial && complex.trialEndsAt && new Date(complex.trialEndsAt) > now

        // Subscription logic
        const subscriptionActive = !!complex.subscriptionEndsAt && new Date(complex.subscriptionEndsAt) > now
        const hasPaidSubscription = subscriptionActive

        const hasAccess = complex.isActive && (hasPaidSubscription || trialActive)

        return NextResponse.json({
            hasAccess,
            isActive: complex.isActive,
            trialExpired: isTrial && !trialActive,
            trialEndsAt: complex.trialEndsAt,
            subscriptionDate: complex.subscriptionDate,
            subscriptionEndsAt: complex.subscriptionEndsAt,
            planType: complex.planType
        })

    } catch (e) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}
