import { NextResponse } from 'next/server'
import { getSession, createToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        // 1. Get session from JWT (gives us the ID)
        const session = await getSession()

        // 2. If no session, reject
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 3. CRITICAL: Fetch FRESH user data from DB using the ID.
        // This solves the stale cookie problem where promoted admins still see "USER" role.
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: {
                id: true,
                email: true,
                role: true,
                complexId: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 4. Check if the token role is stale and auto-refresh if needed
        const tokenRole = session.role || 'USER'
        const dbRole = user.role || 'USER'
        const roleMismatch = tokenRole !== dbRole

        // If role changed, update the token automatically
        if (roleMismatch) {
            console.log(`Role mismatch detected for user ${user.email}: token=${tokenRole}, db=${dbRole}. Auto-refreshing token...`)

            const newToken = await createToken({
                id: user.id,
                email: user.email,
                complexId: user.complexId,
                role: dbRole
            })

            const cookieStore = await cookies()
            cookieStore.set('auth_token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 // 1 day
            })
        }

        return NextResponse.json({
            id: user.id,
            email: user.email,
            complexId: user.complexId,
            role: dbRole,
            tokenRefreshed: roleMismatch // Signal that token was updated
        })
    } catch (e) {
        // Log the full error to the server console for debugging
        console.error('API /auth/me Error:', e)

        // Return a proper JSON response so the client doesn't crash parsing HTML
        return NextResponse.json({
            error: 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? String(e) : undefined
        }, { status: 500 })
    }
}
