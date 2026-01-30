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
                _count: {
                    select: { fields: true, users: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        console.log('[API /saas/complexes] Found', complexes.length, 'complexes')

        // Enhance with revenue and booking stats
        const enhancedCallback = await Promise.all(complexes.map(async (c) => {
            const bookingStats = await prisma.booking.aggregate({
                where: {
                    field: { complexId: c.id },
                    status: 'confirmed'
                },
                _sum: { totalPrice: true },
                _count: true
            })

            return {
                ...c,
                stats: {
                    bookings: bookingStats._count || 0,
                    users: c._count.users,
                    revenue: bookingStats._sum.totalPrice || 0
                }
            }
        }))

        console.log('[API /saas/complexes] Returning enhanced data')
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
                await prisma.$transaction(async (tx) => {
                    // 1. Delete Users
                    await tx.user.deleteMany({ where: { complexId } })

                    // 2. Delete fields (and bookings via manual check if no cascade)
                    const fields = await tx.field.findMany({ where: { complexId }, select: { id: true } })
                    const fieldIds = fields.map(f => f.id)

                    if (fieldIds.length > 0) {
                        await tx.booking.deleteMany({ where: { fieldId: { in: fieldIds } } })
                        await tx.field.deleteMany({ where: { complexId } })
                    }

                    // 3. Delete Accounts and other related tables if any
                    await tx.account.deleteMany({ where: { complexId } })

                    // 4. Delete Complex
                    await tx.complex.delete({ where: { id: complexId } })
                })
                return NextResponse.json({ success: true, deleted: true })

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
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
