import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Revalidate cache every 60 seconds to avoid hitting the DB on every single visit
export const revalidate = 60;

export async function GET() {
    try {
        const [complexesCount, bookingsCount] = await Promise.all([
            prisma.complex.count(),
            prisma.booking.count()
        ]);

        return NextResponse.json({
            complexes: complexesCount,
            bookings: bookingsCount
        });
    } catch (error) {
        console.error("Error fetching live stats:", error);
        // Fallback or default numbers in case of DB downtime
        return NextResponse.json({
            complexes: 0,
            bookings: 0
        }, { status: 500 });
    }
}
