import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
    try {
        const headersList = await headers();
        const userId = headersList.get('x-user-id');

        console.log('[API /saas/audit] userId from header:', userId);

        let currentUser = null;
        if (userId) {
            currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
        }

        if (!currentUser || currentUser.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const logs = await prisma.systemAuditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        console.log('[API /saas/audit] Returning', logs.length, 'logs');
        return NextResponse.json(logs);
    } catch (e) {
        console.error('[API /saas/audit] Error:', e);
        return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }
}
