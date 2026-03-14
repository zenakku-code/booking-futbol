import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
    try {
        const headersList = await headers();
        const authUserId = headersList.get('x-user-id');
        
        console.log('[API /saas/impersonate] Auth User ID:', authUserId);

        let currentUser = null;
        if (authUserId) {
            currentUser = await prisma.user.findUnique({
                where: { id: authUserId },
                select: { id: true, role: true }
            });
        }

        if (!currentUser || currentUser.role !== 'SUPERADMIN') {
            console.log('[API /saas/impersonate] Unauthorized attempt');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const targetId = body.userId || body.targetUserId;

        if (!targetId) {
            return NextResponse.json({ error: "Target User ID is required" }, { status: 400 });
        }

        console.log('[API /saas/impersonate] Impersonating target:', targetId);
 
        // Use Better Auth admin plugin impersonation
        // The admin plugin provides impersonateUser via auth.api
        await auth.api.impersonateUser({
            headers: await headers(),
            body: {
                userId: targetId
            }
        });
 
        // Log the action
        await prisma.systemAuditLog.create({
            data: {
                action: "IMPERSONATE_USER",
                userId: currentUser.id,
                details: JSON.stringify({ targetUserId: targetId })
            }
        });
 
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Impersonation error:", e);
        return NextResponse.json({ error: "Failed to impersonate" }, { status: 500 });
    }
}
