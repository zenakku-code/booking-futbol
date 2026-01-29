import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const method = request.method

    // 1. Protect all /admin routes except /admin/login
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const token = request.cookies.get('auth_token')?.value
        if (!token) return NextResponse.redirect(new URL('/admin/login', request.url))
        const payload = await verifyToken(token)
        if (!payload) return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // 2. Protect sensitive API routes
    // POST/PUT/DELETE on fields
    const isFieldWrite = pathname.startsWith('/api/fields') && ['POST', 'PUT', 'DELETE'].includes(method)
    // GET bookings (only admins should see the list) or PATCH/PUT status
    const isBookingAdmin = pathname.startsWith('/api/bookings') && ['GET', 'PATCH', 'PUT'].includes(method)

    if (isFieldWrite || isBookingAdmin) {
        const token = request.cookies.get('auth_token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/api/fields/:path*', '/api/bookings/:path*'],
}
