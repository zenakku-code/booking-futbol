import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const CLIENT_ID = process.env.MP_CLIENT_ID
    const CLIENT_SECRET = process.env.MP_CLIENT_SECRET
    const REDIRECT_URI = process.env.MP_REDIRECT_URI || 'http://localhost:3000/api/auth/mercadopago/callback'

    if (!CLIENT_ID || !CLIENT_SECRET) {
        return NextResponse.json({ error: 'Missing MP credentials' }, { status: 500 })
    }

    try {
        const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            })
        })

        const data = await tokenRes.json()

        if (!tokenRes.ok) {
            throw new Error(data.message || 'Error exchanging token')
        }

        // Save to DB
        await prisma.account.create({
            data: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                publicKey: data.public_key,
                userId: 'admin' // Single user assumption
            }
        })

        return NextResponse.redirect(new URL('/admin/settings', request.url))
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Authentication Failed' }, { status: 500 })
    }
}
