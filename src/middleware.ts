import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables')
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Define protected routes
    const isAdminRoute = pathname.startsWith('/admin')
    const isLoginPage = pathname === '/admin/login' || pathname === '/api/auth/login' || pathname === '/api/auth/register'

    // Protect /saas-admin routes
    if (pathname.startsWith('/saas-admin') || pathname.startsWith('/api/saas')) {
        const token = request.cookies.get('auth_token')?.value

        if (!token) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        try {
            const { payload } = await jwtVerify(token, SECRET)

            if (payload.role !== 'SUPERADMIN') {
                // Allow GET /api/saas/settings for everyone (pricing fetch)
                if (pathname === '/api/saas/settings' && request.method === 'GET') {
                    // Allow
                } else if (pathname.startsWith('/api/')) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
                } else {
                    // Redirect unauthorized users to their own dashboard
                    return NextResponse.redirect(new URL('/admin', request.url))
                }
            }

            // Add user context to request headers for API routes
            const requestHeaders = new Headers(request.headers)
            requestHeaders.set('x-user-id', payload.id as string)
            requestHeaders.set('x-user-role', payload.role as string)
            requestHeaders.set('x-user-email', payload.email as string)

            return NextResponse.next({
                request: {
                    headers: requestHeaders
                }
            })
        } catch (e) {
            console.error(`[MIDDLEWARE] Token verification failed:`, e)
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    if (isAdminRoute && !isLoginPage) {
        const token = request.cookies.get('auth_token')?.value

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        try {
            await jwtVerify(token, SECRET)
            return NextResponse.next()
        } catch (e) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*', '/api/fields/:path*', '/api/inventory/:path*', '/api/subscription/:path*', '/saas-admin/:path*', '/api/saas/:path*'],
}
