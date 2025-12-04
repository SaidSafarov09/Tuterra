import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validatePhoneNumber, capitalizeFirstLetter, isSingleWord } from '@/lib/validation'

const settingsSchema = z.object({
    firstName: z.string()
        .min(2, 'Имя должно содержать минимум 2 символа')
        .refine(isSingleWord, 'Имя должно быть одним словом без пробелов')
        .transform(capitalizeFirstLetter),
    lastName: z.string()
        .min(2, 'Фамилия должна содержать минимум 2 символа')
        .refine(isSingleWord, 'Фамилия должна быть одним словом без пробелов')
        .transform(capitalizeFirstLetter),
    name: z.string().optional(),
    phone: z.string()
        .optional()
        .nullable()
        .transform(v => v === '' ? null : v)
        .refine(
            (v) => !v || validatePhoneNumber(v),
            'Неверный формат телефона. Используйте формат +7XXXXXXXXXX'
        ),
    avatar: z.string().nullable().optional(),
    currency: z.string().optional(),
    timezone: z.string(),
})

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                currency: true,
                timezone: true,
            },
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
        }

        return NextResponse.json(currentUser)
    } catch (error) {
        console.error('Get settings error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении настроек' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
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
                        id: user.id
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

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                ...validatedData,
                name: validatedData.firstName ? `${validatedData.firstName}${validatedData.lastName ? ' ' + validatedData.lastName : ''}` : null,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                currency: true,
                timezone: true,
            },
        })

        return NextResponse.json(updatedUser)
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
