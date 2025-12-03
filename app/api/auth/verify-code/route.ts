import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionId, code } = body

        if (!sessionId || !code) {
            return NextResponse.json(
                { success: false, error: 'Не указан sessionId или код' },
                { status: 400 }
            )
        }
        const session = await prisma.verificationSession.findUnique({
            where: { id: sessionId },
        })

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Сессия не найдена' },
                { status: 404 }
            )
        }
        if (new Date() > session.expiresAt) {
            await prisma.verificationSession.delete({ where: { id: sessionId } })
            return NextResponse.json(
                { success: false, error: 'Код истек. Запросите новый код' },
                { status: 400 }
            )
        }
        if (session.attemptsLeft <= 0) {
            await prisma.verificationSession.delete({ where: { id: sessionId } })
            return NextResponse.json(
                { success: false, error: 'Превышено количество попыток. Запросите новый код' },
                { status: 400 }
            )
        }
        if (session.code !== code) {
            await prisma.verificationSession.update({
                where: { id: sessionId },
                data: { attemptsLeft: session.attemptsLeft - 1 },
            })

            return NextResponse.json(
                {
                    success: false,
                    error: `Неверный код. Осталось попыток: ${session.attemptsLeft - 1}`
                },
                { status: 400 }
            )
        }

        let user = await prisma.user.findUnique({
            where: { phone: session.phone },
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    phone: session.phone,
                    phoneVerified: true,
                    name: `Новый пользователь`,
                },
            })
        } else {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { phoneVerified: true },
            })
        }
        await prisma.verificationSession.delete({ where: { id: sessionId } })
        const token = await signToken({
            userId: user.id,
            phone: user.phone!,
        })
        const response = NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                avatar: user.avatar,
            },
        })
        response.cookies.set('auth-token', token, {
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Verify code error:', error)
        return NextResponse.json(
            { success: false, error: 'Произошла ошибка при проверке кода' },
            { status: 500 }
        )
    }
}
