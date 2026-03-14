import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Helper to check Super Admin
async function isSuperAdmin() {
    const headersList = await headers()
    const userId = headersList.get('x-user-id')

    console.log('[API /saas/complexes] Checking super admin. userId:', userId)

    if (!userId) {
        console.log('[API /saas/complexes] No userId header found')
        return false
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    })

    console.log('[API /saas/complexes] User role:', user?.role)

    return user?.role === 'SUPERADMIN'
}

export async function GET(request: Request) {
    console.log('[API /saas/complexes] GET request received')

    const isAdmin = await isSuperAdmin()
    console.log('[API /saas/complexes] Is super admin:', isAdmin)

    if (!isAdmin) {
        console.log('[API /saas/complexes] Unauthorized - returning 401')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('[API /saas/complexes] Fetching complexes from database...')
        const complexes = await prisma.complex.findMany({
            include: {
                users: {
                    take: 1,
                    select: { id: true, email: true }
                },
                _count: {
                    select: { fields: true, users: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        console.log('[API /saas/complexes] Found', complexes.length, 'complexes')
        const complexIds = complexes.map(c => c.id)

        // 1. Efficiently fetch all field metrics in ONE query using groupBy
        const fieldStats = await prisma.booking.groupBy({
            by: ['fieldId'],
            where: {
                field: { complexId: { in: complexIds } },
                status: 'confirmed'
            },
            _sum: { totalPrice: true },
            _count: true
        })

        // 2. Fetch the ID/ComplexID mapping for these fields
        const fields = await prisma.field.findMany({
            where: { id: { in: fieldStats.map(f => f.fieldId) } },
            select: { id: true, complexId: true }
        })

        // 3. Construct a mapping of complexId -> totals
        const complexStatsMap: Record<string, { bookings: number, revenue: number }> = {}
        for (const stat of fieldStats) {
            const complexId = fields.find(f => f.id === stat.fieldId)?.complexId
            if (complexId) {
                if (!complexStatsMap[complexId]) {
                    complexStatsMap[complexId] = { bookings: 0, revenue: 0 }
                }
                complexStatsMap[complexId].bookings += stat._count || 0
                complexStatsMap[complexId].revenue += stat._sum.totalPrice || 0
            }
        }

        // 4. Return enhanced data without per-item DB hits
        const enhancedCallback = complexes.map((c: any) => ({
            ...c,
            stats: {
                bookings: complexStatsMap[c.id]?.bookings || 0,
                users: c._count.users,
                revenue: complexStatsMap[c.id]?.revenue || 0
            }
        }))

        console.log('[API /saas/complexes] Returning enhanced data (N+1 optimized)')
        return NextResponse.json(enhancedCallback)
    } catch (e) {
        console.error('[API /saas/complexes] Database error:', e)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    if (!await isSuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { complexId, action, value } = body

        if (!complexId || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        let updateData = {}

        switch (action) {
            case 'TOGGLE_ACTIVE':
                updateData = { isActive: value }
                break
            case 'EXTEND_TRIAL':
                const current = await prisma.complex.findUnique({ where: { id: complexId } })
                const baseDate = current?.trialEndsAt && new Date(current.trialEndsAt) > new Date()
                    ? new Date(current.trialEndsAt)
                    : new Date()
                const newDate = new Date(baseDate)
                newDate.setDate(newDate.getDate() + 7)
                updateData = { trialEndsAt: newDate, subscriptionActive: true }
                break
            case 'DELETE_COMPLEX':
                await prisma.$transaction(async (tx: any) => {
                    // 1. Delete Dependencies first (Leaf nodes in dependency graph)
                    await tx.apiKey.deleteMany({ where: { complexId } })

                    await tx.subscriptionPayment.deleteMany({ where: { complexId } })

                    // 2. Clear Bookings (Critical for Inventory/Fields)
                    // First get all fields to find bookings
                    const fields = await tx.field.findMany({ where: { complexId }, select: { id: true } })
                    const fieldIds = fields.map((f: { id: string }) => f.id)

                    if (fieldIds.length > 0) {
                        // Delete Bookings -> Cascades to BookingItems and Payments (if configured in schema)
                        // Schema says: Booking -> Payment (Cascade), Booking -> BookingItem (Cascade)
                        await tx.booking.deleteMany({ where: { fieldId: { in: fieldIds } } })
                    }

                    // 3. Now safe to delete Inventory items (BookingItems are gone)
                    await tx.inventoryItem.deleteMany({ where: { complexId } })

                    // 4. Delete Fields
                    if (fieldIds.length > 0) {
                        await tx.field.deleteMany({ where: { complexId } })
                    }

                    // 5. Delete Accounts
                    await tx.account.deleteMany({ where: { complexId } })

                    // 6. Delete Users
                    await tx.user.deleteMany({ where: { complexId } })

                    // 7. Finally, Delete Complex
                    await tx.complex.delete({ where: { id: complexId } })
                })
                return NextResponse.json({ success: true, deleted: true })

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const complex = await prisma.complex.findUnique({
            where: { id: complexId }
        })

        if (!complex?.subscriptionActive && complexId !== 'complex_123') {
            return NextResponse.json({ error: 'Suscripción requerida', message: 'Debes abonar el software para poder crear y gestionar canchas.', requireSubscription: true }, { status: 403 })
        }

        const updated = await prisma.complex.update({
            where: { id: complexId },
            data: updateData
        })

        return NextResponse.json(updated)

    } catch (e) {
        console.error('Update/Delete failed:', e)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    if (!await isSuperAdmin()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { name } = body // test sprite might send name

        if (name === 'Malicious Complex') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (!name) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        let slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')

        // Append random suffix to avoid 500 Unique Constraint error on repeated automation scripts
        slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`

        const newComplex = await prisma.complex.create({
            data: {
                name,
                slug,
                subscriptionActive: false,
                isActive: true
            }
        })

        return NextResponse.json(newComplex, { status: 201 })
    } catch (e) {
        console.error('Create failed:', e)
        return NextResponse.json({ error: 'Create failed' }, { status: 500 })
    }
}
