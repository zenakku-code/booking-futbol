import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    console.log(`🔥 [MP Callback] Request URL: ${request.url}`)
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // Aquí viaja el complexId
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    console.log(`🔍 [MP Callback] Params: Code=${code ? 'OK' : 'MISSING'}, State=${state}, Error=${error}`)

    if (error) {
        console.error(`❌ [MP Callback] Mercado Pago devolvió error: ${error} - ${errorDescription}`)
        return NextResponse.json({ error: 'El usuario denegó el acceso', details: error, description: errorDescription }, { status: 400 })
    }

    if (!code || !state) {
        console.error('❌ [MP Callback] Faltan parámetros requeridos (code/state)')
        return NextResponse.json({ error: 'Faltan parámetros requeridos (code/state)' }, { status: 400 })
    }

    const complexId = state

    try {
        console.log('🚀 [MP Callback] Solicitando Tokens a MP...')

        // FIX: Remove trailing slash to prevent double slash in redirect_uri
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

        const payload = {
            client_secret: process.env.MP_PLATFORM_CLIENT_SECRET,
            client_id: process.env.MP_PLATFORM_APP_ID,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${baseUrl}/api/auth/mercadopago/callback`
        }

        // Ocultar secreto en logs
        const logPayload = { ...payload, client_secret: '***HIDDEN***' }
        console.log('📦 [MP Callback] Payload enviado:', JSON.stringify(logPayload))

        // Intercambiar Code por Tokens (Server-to-Server)
        const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        const data = await tokenRes.json()
        console.log(`📬 [MP Callback] Respuesta MP Status: ${tokenRes.status}`)

        if (!tokenRes.ok) {
            console.error('❌ [MP Callback] Error Token Body:', JSON.stringify(data, null, 2))
            throw new Error(data.message || data.error_description || 'Error al obtener tokens de MP')
        }

        console.log('✅ [MP Callback] Tokens obtenidos. Guardando en DB...')

        // Fix: Usar lógica manual en vez de upsert para evitar error de constraint faltante en DB
        const existingAccount = await prisma.account.findFirst({
            where: { complexId: complexId } as any
        })

        const accountData = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            publicKey: data.public_key,
            userId: data.user_id.toString(),
            provider: 'mercadopago',
            updatedAt: new Date(),
            complexId: complexId // Solo necesario en create
        }

        if (existingAccount) {
            console.log(`🔄 [MP Callback] Actualizando cuenta existente ${existingAccount.id}`)
            await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                    accessToken: accountData.accessToken,
                    refreshToken: accountData.refreshToken,
                    publicKey: accountData.publicKey,
                    userId: accountData.userId,
                    provider: accountData.provider,
                    updatedAt: accountData.updatedAt
                }
            })
        } else {
            console.log(`✨ [MP Callback] Creando nueva cuenta para complejo ${complexId}`)
            await prisma.account.create({
                data: accountData
            })
        }

        // Éxito: Redirigir al dashboard
        const dashboardUrl = `${baseUrl}/admin/settings?status=mp_connected`
        return NextResponse.redirect(dashboardUrl)

    } catch (err: any) {
        console.error('OAuth Critical Error:', err)
        return NextResponse.json({
            error: 'Error interno en la vinculación',
            details: err.message
        }, { status: 500 })
    }
}
