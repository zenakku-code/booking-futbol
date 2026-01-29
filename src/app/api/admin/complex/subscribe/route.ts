import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const complexId = await getComplexId()
        if (!complexId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        // SIMULATION: In a real app here we would check if a MP payment was successful
        // Or redirect to MP and wait for webhook. 
        // For this task, we will just activate it to show the flow.

        const updated = await prisma.complex.update({
            where: { id: complexId },
            data: {
                subscriptionActive: true,
                subscriptionDate: new Date()
            }
        })

        return NextResponse.json({ success: true, complex: updated })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
