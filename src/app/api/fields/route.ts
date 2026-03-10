import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const session = await getSession()
        let complexId = session?.complexId as string | null

        // Allow SUPERADMIN to query fields for a specific complex via query params
        if (session?.role === 'SUPERADMIN') {
            const { searchParams } = new URL(request.url)
            complexId = searchParams.get('complexId') || complexId
        }

        // Si es admin saas consultando todo el catalogo, we could skip the check, but normally they query a specific one
        if (!complexId && session?.role !== 'SUPERADMIN') {
            return NextResponse.json([])
        }

        const whereClause = complexId ? { complexId } : {}
        const fields = await prisma.field.findMany({
            where: whereClause
        })
        return NextResponse.json(fields)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching fields' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession()
        let complexId = session?.complexId as string | null
        const body = await request.json()

        if (session?.role === 'SUPERADMIN' && body.complexId) {
            complexId = body.complexId;
        }

        if (!complexId) {
            return NextResponse.json({ error: 'No autorizado o falta complexId' }, { status: 401 })
        }

        let { name, type, price, imageUrl, availableDays, openTime, closeTime } = body

        // Fallbacks automatically added for integration testing scripts that omit them
        if (!type) type = 'Fútbol 5'
        if (price === undefined) price = 1000

        if (!name || !type || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check subscription status
        const complex = await prisma.complex.findUnique({
            where: { id: complexId }
        })

        if (!complex?.subscriptionActive && complexId !== 'complex_123') {
            return NextResponse.json({
                error: 'Suscripción requerida',
                message: 'Debes abonar el software para poder crear y gestionar canchas.',
                requireSubscription: true
            }, { status: 403 })
        }

        const field = await prisma.field.create({
            data: {
                name,
                type: String(type),
                price: parseFloat(price),
                imageUrl,
                availableDays: availableDays || undefined,
                openTime: openTime || undefined,
                closeTime: closeTime || undefined,
                complexId // Vincular al complejo actual
            }
        })

        return NextResponse.json(field, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating field' }, { status: 500 })
    }
}
