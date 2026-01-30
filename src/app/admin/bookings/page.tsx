import { prisma } from "@/lib/prisma"
import BookingManagement from "@/components/admin/BookingManagement"
import { getComplexId } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function BookingsPage() {
    const complexId = await getComplexId()
    if (!complexId) redirect('/admin/login')

    const bookings = await (prisma as any).booking.findMany({
        where: {
            field: { complexId }
        },
        include: {
            field: { include: { complex: true } },
            items: { include: { inventoryItem: true } },
            payments: true
        },
        orderBy: { date: 'desc' }
    })

    // Serialize dates to strings to avoid warning with Pass Client Component
    const serializedBookings = bookings.map((b: any) => {
        const approvedPaymentsSum = b.payments?.filter((p: any) => p.status === 'approved')
            .reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0

        // Sumamos lo que ya estaba en booking.paidAmount (legacy o manual) + pagos individuales
        const totalPaidCalculator = (b.paidAmount || 0) + approvedPaymentsSum

        return {
            ...b,
            date: b.date.toISOString(),
            createdAt: b.createdAt.toISOString(),
            // Añadimos paymentType explícito por si acaso (aunque viene en b) y el calculado
            calculatedPaidAmount: totalPaidCalculator
        }
    })

    return <BookingManagement initialBookings={serializedBookings} />
}
