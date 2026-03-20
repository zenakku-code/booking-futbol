import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey) {
            return NextResponse.json({
                error: 'Authentication failed',
                message: 'Missing x-api-key header'
            }, { status: 401 })
        }

        const keyRecord = await (prisma as any).apiKey.findUnique({
            where: { key: apiKey },
            include: { complex: true }
        })

        if (!keyRecord) {
            return NextResponse.json({
                error: 'Authentication failed',
                message: 'Invalid API Key'
            }, { status: 401 })
        }

        // Fetch fields for this complex
        const fields = await (prisma as any).field.findMany({
            where: { complexId: keyRecord.complexId },
            select: {
                id: true,
                name: true,
                type: true,
                price: true,
                imageUrl: true,
                openTime: true,
                closeTime: true
            }
        })

            // Update last used asynchronously
            // We don't await this to keep response fast
            ; (prisma as any).apiKey.update({
                where: { id: keyRecord.id },
                data: { lastUsed: new Date() }
            }).catch((err: any) => console.error('Failed to update api key stats', err))

        return NextResponse.json({
            success: true,
            data: fields,
            meta: {
                complex: keyRecord.complex.name,
                count: fields.length,
                timestamp: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
