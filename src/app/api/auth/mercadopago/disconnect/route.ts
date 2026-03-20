import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json()
        const { complexId } = body

        if (!complexId) {
            return NextResponse.json({ error: 'Falta complexId' }, { status: 400 })
        }

        // SECURITY FIX: Only allow disconnecting if the user is the owner OR a SUPERADMIN
        if (session.role !== 'SUPERADMIN' && session.complexId !== complexId) {
            console.warn(`🚨 [SECURITY] Intento de IDOR por usuario ${session.email} sobre complejo ${complexId}`);
            return NextResponse.json({ error: 'Forbidden: No tienes permiso para realizar esta acción' }, { status: 403 });
        }

        // Eliminar la cuenta asociada (tokens)
        await prisma.account.deleteMany({
            where: { complexId: complexId }
        })

        return NextResponse.json({ status: 'ok', message: 'Cuenta desconectada' })
    } catch (error) {
        console.error('Disconnect Error:', error)
        return NextResponse.json({ error: 'Error interno al desconectar' }, { status: 500 })
    }
}
