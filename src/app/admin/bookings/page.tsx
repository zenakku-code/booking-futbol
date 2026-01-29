import { prisma } from "@/lib/prisma"
import BookingManagement from "@/components/admin/BookingManagement"

export const dynamic = 'force-dynamic'

export default async function BookingsPage() {
    const bookings = await prisma.booking.findMany({
        include: { field: true },
        orderBy: { date: 'desc' }
    })

    // Serialize dates to strings to avoid warning with Pass Client Component
    const serializedBookings = bookings.map(b => ({
        ...b,
        date: b.date.toISOString(),
        createdAt: b.createdAt.toISOString()
    }))

    return <BookingManagement initialBookings={serializedBookings} />
}
