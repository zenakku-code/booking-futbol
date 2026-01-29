import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function DELETE() {
    try {
        const complexId = await getComplexId()
        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Delete only the account belonging to this complex
        await prisma.account.deleteMany({
            where: { complexId }
        })

        return NextResponse.json({ success: true, message: 'Cuenta desconectada correctamente' })
    } catch (error) {
        console.error('Error disconnecting account:', error)
        return NextResponse.json({ error: 'Error al desconectar la cuenta' }, { status: 500 })
    }
}
