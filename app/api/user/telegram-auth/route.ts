import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const payload = await verifyToken(token)

        if (!payload) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        // Generate detailed unique code
        const code = uuidv4()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        await prisma.verificationCode.create({
            data: {
                userId: payload.userId,
                code: code,
                type: 'TELEGRAM_LINK',
                expiresAt: expiresAt
            }
        })

        return NextResponse.json({ code })

    } catch (error) {
        console.error('Telegram auth error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при генерации кода' },
            { status: 500 }
        )
    }
}
