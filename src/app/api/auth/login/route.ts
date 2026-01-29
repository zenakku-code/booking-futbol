import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        console.log('Login request body:', JSON.stringify(body))
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            console.log('User not found:', email)
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
        }

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            console.log('Invalid password for:', email)
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
        }

        const token = await createToken({
            id: user.id,
            email: user.email,
            complexId: user.complexId
        })
        console.log('Token created for:', email)
        const cookieStore = await cookies()

        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 1 day
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('FATAL Login error:', error)
        return NextResponse.json({
            error: 'Error en el servidor',
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}
