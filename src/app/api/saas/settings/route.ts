
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch current prices
export async function GET() {
    try {
        const session = await getSession()
        // Allow Super Admin AND regular users (to display prices in subscription cards)
        // But maybe restrictive? No, subscription page needs to see global prices.
        // Actually, for SaaS Settings (Admin Panel), strict check.
        // For public prices, maybe a separate logic or allow all authenticated.
        // Let's allow all authenticated for GET, but restrict validation in PUT.

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const config = await prisma.systemConfig.findFirst({
            orderBy: { updatedAt: 'desc' } // Should only be one, but just in case
        })

        if (!config) {
            // Fallback if DB empty (though migration should have handled it)
            return NextResponse.json({
                monthlyPrice: 10000,
                quarterlyPrice: 27000
            })
        }

        return NextResponse.json({
            id: config.id,
            monthlyPrice: config.monthlyPrice,
            quarterlyPrice: config.quarterlyPrice
        })

    } catch (e) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}

// PUT: Update prices (SUPER ADMIN ONLY)
export async function PUT(request: Request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await prisma.user.findUnique({ where: { email: session.email } })
        if (user?.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { monthlyPrice, quarterlyPrice } = body

        if (!monthlyPrice || !quarterlyPrice) {
            return NextResponse.json({ error: 'Missing values' }, { status: 400 })
        }

        // Upsert logic (update if exists, create if not)
        // Since we don't know the ID easily, findFirst then update, or delete all and create new?
        // Better: findFirst
        const existing = await prisma.systemConfig.findFirst()

        let config
        if (existing) {
            config = await prisma.systemConfig.update({
                where: { id: existing.id },
                data: {
                    monthlyPrice: parseFloat(monthlyPrice),
                    quarterlyPrice: parseFloat(quarterlyPrice)
                }
            })
        } else {
            config = await prisma.systemConfig.create({
                data: {
                    monthlyPrice: parseFloat(monthlyPrice),
                    quarterlyPrice: parseFloat(quarterlyPrice)
                }
            })
        }

        return NextResponse.json({ success: true, config })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}
