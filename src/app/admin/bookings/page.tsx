import { prisma } from "@/lib/prisma"
import BookingManagement from "@/components/admin/BookingManagement"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function BookingsPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string, limit?: string, search?: string }>
}) {
    const session = await getSession()
    if (!session || !session.complexId) redirect('/admin/login')
    const complexId = session.complexId

    const params = await searchParams
    const page = Math.max(1, parseInt(params.page || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || '50')))
    const skip = (page - 1) * limit
    const search = params.search || ''

    // 1. Parallel fetching of paginated bookings and total count
    const [bookings, totalCount] = await Promise.all([
        (prisma as any).booking.findMany({
            where: {
                field: { complexId },
                ...(search ? {
                    OR: [
                        { clientName: { contains: search } },
                        { clientPhone: { contains: search } },
                        { id: { contains: search } }
                    ]
                } : {})
            },
            include: {
                field: { include: { complex: true } },
                items: { include: { inventoryItem: true } },
                payments: true
            },
            orderBy: { date: 'desc' },
            take: limit,
            skip: skip
        }),
        (prisma as any).booking.count({
            where: {
                field: { complexId },
                ...(search ? {
                    OR: [
                        { clientName: { contains: search } },
                        { clientPhone: { contains: search } },
                        { id: { contains: search } }
                    ]
                } : {})
            }
        })
    ])

    // 2. Serialize dates and calculate paid amounts
    const serializedBookings = bookings.map((b: any) => {
        const approvedPaymentsSum = b.payments?.filter((p: any) => p.status === 'approved')
            .reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0

        const totalPaidCalculator = (b.paidAmount || 0) + approvedPaymentsSum

        return {
            ...b,
            date: b.date.toISOString(),
            createdAt: b.createdAt.toISOString(),
            calculatedPaidAmount: totalPaidCalculator
        }
    })

    return (
        <BookingManagement 
            initialBookings={serializedBookings} 
            totalCount={totalCount}
            currentPage={page}
            limit={limit}
        />
    )
}
