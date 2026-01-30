import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { complexId } = body

        if (!complexId) {
            return NextResponse.json({ error: 'Falta complexId' }, { status: 400 })
        }

        // Eliminar la cuenta asociada (tokens)
        // Usamos deleteMany porque delete requiere unique exacto y a veces complexId puede dar problemas si no es unique indexado como vimos antes
        await prisma.account.deleteMany({
            where: { complexId: complexId }
        })

        return NextResponse.json({ status: 'ok', message: 'Cuenta desconectada' })
    } catch (error) {
        console.error('Disconnect Error:', error)
        return NextResponse.json({ error: 'Error interno al desconectar' }, { status: 500 })
    }
}
