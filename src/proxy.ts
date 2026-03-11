import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const method = request.method

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

    // 1. Protect all /admin routes except /admin/login
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // 2. Protect sensitive API routes
    // POST/PUT/DELETE on fields
    const isFieldWrite = pathname.startsWith('/api/fields') && ['POST', 'PUT', 'DELETE'].includes(method)
    // GET bookings (only admins should see the list) or PATCH/PUT status
    const isBookingAdmin = pathname.startsWith('/api/bookings') && ['GET', 'PATCH', 'PUT'].includes(method)

    if (isFieldWrite || isBookingAdmin) {
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/api/fields/:path*', '/api/bookings/:path*'],
}
