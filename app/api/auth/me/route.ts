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

        let userResult = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                role: true,
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
                onboardingCompleted: true,
                isPro: true,
                proActivatedAt: true,
                proExpiresAt: true,
                telegramId: true,
                bonusMonthsEarned: true,
                _count: {
                    select: {
                        groups: true,
                        invitedUsers: true,
                    },
                },
            },
        })

        if (!userResult) {
            return NextResponse.json(
                { success: false, error: 'Пользователь не найден' },
                { status: 404 }
            )
        }

        // Generate referral code if missing
        if (!userResult.referralCode) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            userResult = await prisma.user.update({
                where: { id: userResult.id },
                data: { referralCode: code },
                select: {
                    id: true,
                    role: true,
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
                    onboardingCompleted: true,
                    isPro: true,
                    proActivatedAt: true,
                    proExpiresAt: true,
                    telegramId: true,
                    _count: {
                        select: { groups: true }
                    }
                },
            }) as any
        }

        if (!userResult) {
            return NextResponse.json(
                { success: false, error: 'Пользователь не найден' },
                { status: 404 }
            )
        }

        if (userResult.role === 'student') {
            const studentRecords = await prisma.student.findMany({
                where: { linkedUserId: userResult.id },
                include: {
                    _count: {
                        select: { groups: true }
                    }
                }
            })
            const studentGroupsCount = await prisma.group.count({
                where: {
                    students: {
                        some: {
                            linkedUserId: userResult.id
                        }
                    }
                }
            })

            const finalUser = {
                ...userResult,
                groupsCount: studentGroupsCount
            }

            return NextResponse.json({
                success: true,
                user: finalUser,
            })
        }

        const finalUser = userResult ? {
            ...userResult,
            groupsCount: (userResult as any)._count?.groups || 0
        } : null;

        return NextResponse.json({
            success: true,
            user: finalUser,
        })
    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { success: false, error: 'Произошла ошибка' },
            { status: 500 }
        )
    }
}
