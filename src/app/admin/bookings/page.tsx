import { prisma } from "@/lib/prisma"
import BookingManagement from "@/components/admin/BookingManagement"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function BookingsPage() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

    const bookings = await prisma.booking.findMany({
        where: {
            field: { complexId }
        },
        include: { field: true },
        orderBy: { date: 'desc' }
    })

    // Serialize dates to strings to avoid warning with Pass Client Component
    const serializedBookings = bookings.map((b: any) => ({
        ...b,
        date: b.date.toISOString(),
        createdAt: b.createdAt.toISOString()
    }))

    return <BookingManagement initialBookings={serializedBookings} />
}
