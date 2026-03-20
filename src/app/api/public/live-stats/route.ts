import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrSetCache } from '@/lib/redis';

export async function GET() {
    try {
        const stats = await getOrSetCache('live_stats', async () => {
            const [complexesCount, bookingsCount] = await Promise.all([
                prisma.complex.count(),
                prisma.booking.count()
            ]);
            return {
                complexes: complexesCount,
                bookings: bookingsCount
            };
        }, 60); // 1 minute cache

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching live stats:", error);
        // Fallback or default numbers in case of DB downtime
        return NextResponse.json({
            complexes: 0,
            bookings: 0
        }, { status: 500 });
    }
}
