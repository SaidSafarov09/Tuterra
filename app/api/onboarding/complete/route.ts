import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

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

        await prisma.user.update({
            where: { id: payload.userId },
            data: { onboardingCompleted: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Onboarding complete error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при завершении онбординга' },
            { status: 500 }
        )
    }
}
