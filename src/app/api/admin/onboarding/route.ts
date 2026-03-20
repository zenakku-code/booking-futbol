import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const session = await getSession()
        
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Si ya tiene un complejo, no permitir crear otro por ahora (limite SaaS actual)
        if (session.complexId) {
            return NextResponse.json({ error: 'El usuario ya posee un complejo' }, { status: 400 })
        }

        const body = await request.json()
        const { complexName } = body

        if (!complexName || complexName.length < 3) {
            return NextResponse.json({ error: 'Nombre de complejo inválido' }, { status: 400 })
        }

        // Generate Slug
        const slug = complexName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')

        // Check availability
        const existingComplex = await (prisma as any).complex.findUnique({ where: { slug } })
        if (existingComplex) {
            return NextResponse.json({ error: 'Ese nombre ya está en uso, probá con otro' }, { status: 400 })
        }

        // Create Complex and Link to User in Transaction
        const result = await prisma.$transaction(async (tx) => {
            const newComplex = await (tx as any).complex.create({
                data: {
                    name: complexName,
                    slug: slug,
                    subscriptionActive: true, // Auto-activate trial for social signups
                    trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days trial
                    isActive: true
                }
            })

            await (tx as any).user.update({
                where: { id: session.id },
                data: {
                    complexId: newComplex.id
                }
            })

            return newComplex
        })

        // Notify via Telegram
        try {
            const { sendTelegramNotification } = await import('@/lib/telegram')
            sendTelegramNotification(`🆕 <b>Nuevo Onboarding Social</b>\n\n⚽ <b>Complejo:</b> ${complexName}\n📧 <b>Email:</b> ${session.email}`).catch(console.error)
        } catch (e) {
            // Silently fail telegram notification
        }

        return NextResponse.json({ success: true, complexId: result.id })
    } catch (error: any) {
        console.error('Onboarding Error:', error)
        return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 })
    }
}
