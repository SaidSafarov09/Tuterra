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

        // Find verification session
        const session = await prisma.verificationSession.findUnique({
            where: { id: sessionId },
        })

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Сессия не найдена' },
                { status: 404 }
            )
        }

        // Check if session expired
        if (new Date() > session.expiresAt) {
            await prisma.verificationSession.delete({ where: { id: sessionId } })
            return NextResponse.json(
                { success: false, error: 'Код истек. Запросите новый код' },
                { status: 400 }
            )
        }

        // Check attempts left
        if (session.attemptsLeft <= 0) {
            await prisma.verificationSession.delete({ where: { id: sessionId } })
            return NextResponse.json(
                { success: false, error: 'Превышено количество попыток. Запросите новый код' },
                { status: 400 }
            )
        }

        // Verify code
        if (session.code !== code) {
            // Decrease attempts
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

        // Code is correct - find or create user
        let user = await prisma.user.findUnique({
            where: { phone: session.phone },
        })

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    phone: session.phone,
                    phoneVerified: true,
                    name: `Пользователь ${session.phone.slice(-4)}`,
                },
            })
        } else {
            // Update phone verification status
            user = await prisma.user.update({
                where: { id: user.id },
                data: { phoneVerified: true },
            })
        }

        // Delete verification session
        await prisma.verificationSession.delete({ where: { id: sessionId } })

        // Generate JWT token
        const token = await signToken({
            userId: user.id,
            phone: user.phone!,
        })

        // Create response with httpOnly cookie
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

        // Set httpOnly cookie
        response.cookies.set('auth-token', token, {
            httpOnly: process.env.NODE_ENV === 'production', // false in development
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
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
