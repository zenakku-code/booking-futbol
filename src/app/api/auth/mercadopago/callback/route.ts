import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // Aquí viaja el complexId
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.json({ error: 'El usuario denegó el acceso', details: error }, { status: 400 })
    }

    if (!code || !state) {
        return NextResponse.json({ error: 'Faltan parámetros requeridos (code/state)' }, { status: 400 })
    }

    const complexId = state

    try {
        // Intercambiar Code por Tokens (Server-to-Server)
        const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_secret: process.env.MP_PLATFORM_CLIENT_SECRET, // Credenciales de TU Plataforma
                client_id: process.env.MP_PLATFORM_APP_ID,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/mercadopago/callback`
            })
        })

        const data = await tokenRes.json()

        if (!tokenRes.ok) {
            console.error('Mercado Pago Token Error:', data)
            throw new Error(data.message || 'Error al obtener tokens de MP')
        }

        // data contiene: access_token, refresh_token, user_id, public_key, etc.

        // Guardar en Base de Datos de forma segura
        await prisma.account.upsert({
            where: { complexId: complexId },
            update: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                publicKey: data.public_key,
                userId: data.user_id.toString(), // ID de vendedor MP
                provider: 'mercadopago',
                updatedAt: new Date()
            },
            create: {
                complexId: complexId,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                publicKey: data.public_key,
                userId: data.user_id.toString(),
                provider: 'mercadopago'
            }
        })

        // Éxito: Redirigir al dashboard
        const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/settings?status=mp_connected`
        return NextResponse.redirect(dashboardUrl)

    } catch (err: any) {
        console.error('OAuth Critical Error:', err)
        return NextResponse.json({
            error: 'Error interno en la vinculación',
            details: err.message
        }, { status: 500 })
    }
}
