import { NextResponse } from 'next/server'

export async function GET() {
    const CLIENT_ID = process.env.MP_CLIENT_ID
    const REDIRECT_URI = process.env.MP_REDIRECT_URI || 'http://localhost:3000/api/auth/mercadopago/callback'

    if (!CLIENT_ID) {
        return NextResponse.json({ error: 'Missing MP_CLIENT_ID' }, { status: 500 })
    }

    // Generate random state for security (omitted for brevity in MVP)
    const state = 'random_state_string'

    const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

    return NextResponse.redirect(authUrl)
}
