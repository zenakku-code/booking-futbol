import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const adminComplexId = await getComplexId()
        if (!adminComplexId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { date, fieldId } = body

        // Si no mandan fieldId, limpiamos todo el complejo para esa fecha (más útil)
        const whereClause: any = {
            field: { complexId: adminComplexId },
            status: { not: 'confirmed' } // BORRAR TODO LO NO CONFIRMADO (pending, cancelled, collecting...)
        }

        if (date) {
            // Manejar fechas con cuidado en UTC
            // Asumimos que date viene YYYY-MM-DD
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(date)
            endOfDay.setHours(23, 59, 59, 999)

            whereClause.date = {
                gte: startOfDay,
                lte: endOfDay
            }
        }

        if (fieldId) {
            whereClause.fieldId = fieldId
        }

        console.log('[Force Unlock] Running deleteMany with:', JSON.stringify(whereClause))

        const result = await prisma.booking.deleteMany({
            where: whereClause
        })

        console.log('[Force Unlock] Deleted count:', result.count)

        return NextResponse.json({
            success: true,
            deleted: result.count,
            message: `Se liberaron ${result.count} reservas pendientes/trabadas.`
        })

    } catch (error) {
        console.error('Force Unlock Error:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
