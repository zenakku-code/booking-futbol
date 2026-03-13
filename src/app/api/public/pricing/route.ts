import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const config = await prisma.systemConfig.findFirst({
            orderBy: { updatedAt: 'desc' }
        });

        if (!config) {
            return NextResponse.json({
                monthlyPrice: 10000,
                quarterlyPrice: 27000,
                annualPrice: 100000
            });
        }

        return NextResponse.json({
            monthlyPrice: config.monthlyPrice,
            quarterlyPrice: config.quarterlyPrice,
            annualPrice: config.annualPrice || 100000
        });
    } catch (error) {
        console.error("Error fetching public pricing:", error);
        return NextResponse.json({
            monthlyPrice: 10000,
            quarterlyPrice: 27000,
            annualPrice: 100000
        });
    }
}
