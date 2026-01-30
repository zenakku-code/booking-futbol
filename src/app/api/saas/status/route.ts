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
                subscriptionDate: true
            }
        })

        if (!complex) {
            return NextResponse.json({ error: 'Complex not found' }, { status: 404 })
        }

        const now = new Date()
        const isTrial = !!complex.trialEndsAt
        const trialExpired = isTrial && complex.trialEndsAt && new Date(complex.trialEndsAt) < now
        const hasPaidSubscription = !!complex.subscriptionDate

        // Access logic:
        // 1. If manually banned (isActive = false) -> No access
        // 2. If has paid subscription -> Access granted
        // 3. If on trial and not expired -> Access granted
        // 4. Otherwise -> No access
        const hasAccess = complex.isActive && (
            hasPaidSubscription ||
            (isTrial && !trialExpired)
        )

        return NextResponse.json({
            hasAccess,
            isActive: complex.isActive,
            trialExpired: trialExpired || false,
            trialEndsAt: complex.trialEndsAt,
            subscriptionDate: complex.subscriptionDate
        })

    } catch (e) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}
