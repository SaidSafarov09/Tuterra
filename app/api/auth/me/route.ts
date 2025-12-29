import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
    try {

        const token = request.cookies.get('auth-token')?.value

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Не авторизован' },
                { status: 401 }
            )
        }

        const payload = await verifyToken(token)

        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Невалидный токен' },
                { status: 401 }
            )
        }
        let user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                phone: true,
                email: true,
                avatar: true,
                currency: true,
                timezone: true,
                birthDate: true,
                region: true,
                referralCode: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Пользователь не найден' },
                { status: 404 }
            )
        }

        // Generate referral code if missing
        if (!user.referralCode) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            user = await prisma.user.update({
                where: { id: user.id },
                data: { referralCode: code },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    name: true,
                    phone: true,
                    email: true,
                    avatar: true,
                    currency: true,
                    timezone: true,
                    birthDate: true,
                    region: true,
                    referralCode: true,
                },
            }) as any
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
