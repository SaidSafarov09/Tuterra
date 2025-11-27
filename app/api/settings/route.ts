import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const settingsSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    phone: z.string().optional().nullable().transform(v => v === '' ? null : v),
    avatar: z.string().nullable().optional(),
    currency: z.string().optional(),
    timezone: z.string(),
})

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                currency: true,
                timezone: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Get settings error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении настроек' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = settingsSchema.parse(body)

        // Check if phone is taken by another user
        if (validatedData.phone) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    phone: validatedData.phone,
                    NOT: {
                        id: session.user.id
                    }
                }
            })

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Этот номер телефона уже используется' },
                    { status: 400 }
                )
            }
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: validatedData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                currency: true,
                timezone: true,
            },
        })

        return NextResponse.json(user)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Update settings error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении настроек' },
            { status: 500 }
        )
    }
}
