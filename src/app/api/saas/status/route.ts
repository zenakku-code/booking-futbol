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

        // Trial logic: Active if trialEndsAt is in future
        // If strict mode, we might want to ensure they haven't "used up" the trial, but trialEndsAt check covers expiry.
        const trialActive = isTrial && complex.trialEndsAt && new Date(complex.trialEndsAt) > now

        // Subscription logic: Valid if subscriptionEndsAt is in future
        const subscriptionActive = !!complex.subscriptionEndsAt && new Date(complex.subscriptionEndsAt) > now

        // Fallback for legacy (if subscriptionDate exists but no end date, assume active for now or migrate)
        // STRICT MODE REQUESTED: "Expires blocks all functions". So we enforce checking.
        // But for transition, if they paid before this update? 
        // We will assume legacy users need to be migrated or granted a default period.
        // For now, strict check:
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
