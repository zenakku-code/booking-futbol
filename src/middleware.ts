import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Define protected routes
    const isAdminRoute = pathname.startsWith('/admin')
    const isLoginPage = pathname === '/admin/login' || pathname === '/api/auth/login' || pathname === '/api/auth/register'

    // Fetch session from better auth's built-in get-session endpoint
    const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
        headers: {
            cookie: request.headers.get('cookie') || '',
        }
    });

    let session = null;
    if (sessionRes.ok) {
        try {
            session = await sessionRes.json();
        } catch (e) { }
    }

    const { user } = session || {};

    // Protect /saas-admin routes
    if (pathname.startsWith('/saas-admin') || pathname.startsWith('/api/saas')) {
        if (!user) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        if (user.role !== 'SUPERADMIN') {
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
        requestHeaders.set('x-user-id', user.id as string)
        requestHeaders.set('x-user-role', user.role as string)
        requestHeaders.set('x-user-email', user.email as string)

        return NextResponse.next({
            request: {
                headers: requestHeaders
            }
        })
    }

    if (isAdminRoute && !isLoginPage) {
        if (!user) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
        return NextResponse.next()
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*', '/api/fields/:path*', '/api/inventory/:path*', '/api/subscription/:path*', '/saas-admin/:path*', '/api/saas/:path*'],
}
