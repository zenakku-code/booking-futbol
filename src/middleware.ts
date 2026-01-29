import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-me')

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Define protected routes
    const isAdminRoute = pathname.startsWith('/admin')
    const isLoginPage = pathname === '/admin/login' || pathname === '/api/auth/login' || pathname === '/api/auth/register'

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
    matcher: ['/admin/:path*', '/api/admin/:path*', '/api/fields/:path*', '/api/inventory/:path*'],
}
