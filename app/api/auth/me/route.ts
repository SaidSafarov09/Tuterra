import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
    try {
        // Get token from cookie
        const token = request.cookies.get('auth-token')?.value

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Не авторизован' },
                { status: 401 }
            )
        }

        const payload = verifyToken(token)

        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Невалидный токен' },
                { status: 401 }
            )
        }
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                avatar: true,
                currency: true,
                timezone: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Пользователь не найден' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            user,
        })
    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { success: false, error: 'Произошла ошибка' },
            { status: 500 }
        )
    }
}
