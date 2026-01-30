import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const complexId = searchParams.get('complexId')

    if (!complexId) {
        return NextResponse.json({ error: 'Falta complexId' }, { status: 400 })
    }

    const appId = process.env.MP_PLATFORM_APP_ID
    // URL de retorno de tu aplicación
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/mercadopago/callback`

    // State: Usamos esto para pasar el complexId de forma segura a través del flujo de OAuth
    // En producción serio, esto debería ser un token firmado o encriptado para evitar CSRF.
    const state = complexId

    // Mercado Pago OAuth URL
    // Ajustar TLD según país si es necesario (.com.ar, .cl, .mx, etc).
    // Usamos el global auth.mercadopago.com.ar por defecto para Argentina.
    const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${appId}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${redirectUri}`

    console.log(`🚀 [MP Authorize] Iniciando flujo OAuth.`)
    console.log(`ℹ️ [MP Authorize] AppID: ${appId}, RedirectURI: ${redirectUri}, State: ${state}`)
    console.log(`🔗 [MP Authorize] Auth URL: ${authUrl}`)

    return NextResponse.redirect(authUrl)
}
