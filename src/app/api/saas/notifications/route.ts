import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
    try {
        const headersList = await headers();
        const userId = headersList.get('x-user-id');

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

        const notifications = await prisma.globalNotification.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(notifications);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

// --- WhatsApp Business API Helper (Placeholder) ---
async function sendWhatsAppBroadcast(title: string, message: string) {
    // Para implementar esto, el usuario necesita: 
    // 1. WhatsApp Business API (Meta Cloud API) access token
    // 2. Phone Number ID
    // 3. Un template pre-aprobado por Meta (obligatorio para broadcasts)

    console.log(`[WhatsApp] Intentando difundir: ${title}`);
    
    // MOCK: Esto simula la llamada a Meta
    /**
    const WA_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
    
    // Meta requiere templates. No se puede enviar texto libre en broadcast.
    const res = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WA_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: "RECIPIENT_LIST", // Habria que loopear usuarios
            type: "template",
            template: {
                name: "broadcast_notification",
                language: { code: "es_AR" },
                components: [{
                    type: "body",
                    parameters: [
                        { type: "text", text: title },
                        { type: "text", text: message }
                    ]
                }]
            }
        })
    });
    */
}

export async function POST(request: Request) {
    try {
        const headersList = await headers();
        const userId = headersList.get('x-user-id');

        let currentUser = null;
        if (userId) {
            currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true }
            });
        }

        if (!currentUser || currentUser.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, message, type, expiresAt, sendWhatsApp } = await request.json();

        // ... notification creation ...
        const notification = await prisma.globalNotification.create({
            data: {
                title,
                message,
                type: type || 'info',
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                active: true
            }
        });

        // Trigger WhatsApp if requested
        if (sendWhatsApp) {
            await sendWhatsAppBroadcast(title, message);
        }

        await prisma.systemAuditLog.create({
            data: {
                action: "CREATE_GLOBAL_NOTIFICATION",
                userId: currentUser.id,
                details: JSON.stringify({ notificationId: notification.id, title, whatsapp: sendWhatsApp })
            }
        });

        return NextResponse.json(notification);
    } catch (e) {
        console.error("Broadcast failed:", e);
        return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || session.user.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, active } = await request.json();

        const notification = await prisma.globalNotification.update({
            where: { id },
            data: { active }
        });

        return NextResponse.json(notification);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
}
