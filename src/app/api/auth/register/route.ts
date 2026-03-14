import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { complexName, email, password } = body

        if (!complexName || !email || !password) {
            return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
        }

        // Security: Input length limits
        if (complexName.length > 100 || email.length > 100 || password.length > 100) {
            return NextResponse.json({ error: 'Entrada demasiado larga' }, { status: 400 })
        }

        // Content moderation: Block offensive/obscene names
        const blockedWords = [
            // Spanish offensive & Lunfardo
            'puto', 'puta', 'mierda', 'verga', 'culo', 'pendejo', 'pendeja',
            'boludo', 'pelotudo', 'pelotuda', 'forro', 'forra', 'trolo', 'trola',
            'concha', 'choto', 'chota', 'mogolico', 'mogolica', 'tarado',
            'idiota', 'estupido', 'estupida', 'maricon', 'pija', 'poronga',
            'cogido', 'coger', 'garchar', 'cagar', 'carajo', 'hdp',
            'sorete', 'pajero', 'pajera', 'ojete', 'orto', 'conchudo', 'conchuda',
            'malparido', 'malparida', 'chupala', 'chupame', 'chupete', 'pete',
            'petear', 'garca', 'turro', 'turra', 'groncho', 'groncha', 'mufa',
            'alcahuete', 'buchon', 'buchona', 'vigilante', 'yuta', 'rati',
            'zorra', 'atorrante', 'reputa', 'reputo', 'pajuerano', 'otario',
            'careta', 'chanta', 'vendehumo', 'ortiva', 'forreado', 'forreada',
            'me la como', 'me la chupa', 'me la chupan', 'rompeme el culo',
            // English offensive
            'fuck', 'shit', 'ass', 'dick', 'bitch', 'bastard',
            'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut',
            'cock', 'pussy', 'cunt', 'damn', 'penis', 'vagina'
        ]

        const nameToCheck = complexName.toLowerCase().replace(/[^a-záéíóúñü]/gi, ' ')
        const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-záéíóúñü]/gi, ' ')
        const textToCheck = `${nameToCheck} ${emailPrefix}`

        // Optimized regex: join all words with boundaries
        const profanityRegex = new RegExp(`\\b(${blockedWords.join('|')})\\b`, 'i')

        if (profanityRegex.test(textToCheck)) {
            return NextResponse.json({
                error: 'El nombre del complejo o email contiene contenido inapropiado. Por favor usá un nombre profesional.'
            }, { status: 400 })
        }

        // 0. Password Complexity Check
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
        if (!passwordRegex.test(password)) {
            return NextResponse.json({
                error: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número.'
            }, { status: 400 })
        }


        // 0. Rate Limit (Global protection for registry)
        const { headers } = await import('next/headers')
        const { rateLimit } = await import('@/lib/rate-limit')
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'

        if (!rateLimit(ip, 3, 3600000)) { // 3 attempts per hour per IP
            return NextResponse.json({ error: 'Too many registration attempts. Try again later.' }, { status: 429 })
        }

        // 1. Generate Slug
        const slug = complexName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '')

        // 2. Check if complex slug or email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 })
        }

        const existingComplex = await prisma.complex.findUnique({ where: { slug } })
        if (existingComplex) {
            return NextResponse.json({ error: 'Ya existe un complejo con ese nombre o similar' }, { status: 400 })
        }

        // 3. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10)

        // 4. Create Complex and User in a Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create complex WITHOUT automatic trial activation
            const newComplex = await tx.complex.create({
                data: {
                    name: complexName,
                    slug: slug,
                    subscriptionActive: false,  // User must activate trial manually
                    trialEndsAt: null,          // No trial until activated
                    isActive: true
                }
            })

            const newUser = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword, // Keep for legacy if needed, but Better Auth uses AuthAccount
                    complexId: newComplex.id,
                    name: complexName // Set name as complex name by default
                }
            })

            // 5. Create AuthAccount for Better Auth
            await tx.authAccount.create({
                data: {
                    userId: newUser.id,
                    accountId: newUser.id,
                    providerId: "credential",
                    password: hashedPassword,
                }
            })

            return { newComplex, newUser }
        })

        // 5. Notify Admin via Telegram (Async - don't block response)
        const { sendTelegramNotification } = await import('@/lib/telegram')
        const notificationMsg = `🚀 <b>Nuevo Complejo Registrado</b>\n\n⚽ <b>Complejo:</b> ${complexName}\n📧 <b>Email:</b> ${email}\n🔗 <b>Slug:</b> ${result.newComplex.slug}`

        // Fire and forget (don't await to speed up response)
        sendTelegramNotification(notificationMsg).catch(console.error)

        return NextResponse.json({
            success: true,
            message: 'Complejo registrado correctamente',
            complex: result.newComplex.slug
        })

    } catch (error) {
        console.error('Registration Error:', error)
        return NextResponse.json({
            error: 'Error al registrar el complejo',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
