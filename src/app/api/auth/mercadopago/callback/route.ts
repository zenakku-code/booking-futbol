import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComplexId } from '@/lib/auth'

export async function GET(request: Request) {
    const complexId = await getComplexId()
    if (!complexId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

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

        // Save or Update Account linked to the complex
        await prisma.account.upsert({
            where: { complexId },
            update: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                publicKey: data.public_key,
                updatedAt: new Date()
            },
            create: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                publicKey: data.public_key,
                complexId,
                userId: 'admin' // Keep for compatibility but prioritize complexId
            }
        })

        return NextResponse.redirect(new URL('/admin/settings', request.url))
    } catch (error) {
        console.error('MP OAuth Callback Error:', error)
        return NextResponse.json({ error: 'Authentication Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
