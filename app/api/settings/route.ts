import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validatePhoneNumber, validateEmail, capitalizeFirstLetter, isSingleWord, validateBirthDate } from '@/lib/validation'

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
    email: z.string()
        .optional()
        .nullable()
        .transform(v => v === '' ? null : v)
        .refine(
            (v) => !v || validateEmail(v),
            'Неверный формат email'
        ),
    phone: z.string()
        .optional()
        .nullable()
        .transform(v => v === '' ? null : v)
        .refine(
            (v) => !v || validatePhoneNumber(v),
            'Неверный формат телефона. Используйте формат +7XXXXXXXXXX'
        ),
    avatar: z.string().nullable().optional(),
    birthDate: z.string().optional().nullable()
        .transform(v => v ? new Date(v) : null)
        .refine(date => {
            if (!date) return true
            const { valid } = validateBirthDate(date)
            return valid
        }, 'Некорректная дата рождения (должна быть с 1940 года и до сегодня)'),
    currency: z.string().optional(),
    timezone: z.string(),
    region: z.string().optional().nullable(),
    notificationSettings: z.object({
        lessonReminders: z.boolean(),
        unpaidLessons: z.boolean(),
        statusChanges: z.boolean(),
        incomeReports: z.boolean(),
        studentDebts: z.boolean(),
        missingLessons: z.boolean(),
        onboardingTips: z.boolean(),
        deliveryWeb: z.boolean(),
        deliveryTelegram: z.boolean(),
        quietHoursEnabled: z.boolean(),
        quietHoursStart: z.string().nullable().optional(),
        quietHoursEnd: z.string().nullable().optional(),
    }).optional(),
})

export async function GET(request: NextRequest) {
    try {

        const token = request.cookies.get('auth-token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }


        const payload = await verifyToken(token)

        if (!payload) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }
        const currentUser = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                birthDate: true,
                currency: true,
                timezone: true,
                region: true,
                theme: true,
                notificationSettings: true,
                authProviders: {
                    select: {
                        provider: true,
                    },
                },
            },
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
        }
        const hasOAuthProvider = currentUser.authProviders.length > 0

        return NextResponse.json({
            ...currentUser,
            hasOAuthProvider,
            authProviders: undefined,
        })
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
        const token = request.cookies.get('auth-token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }
        const payload = await verifyToken(token)

        if (!payload) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = settingsSchema.parse(body)
        const userWithProviders = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                email: true,
                authProviders: {
                    select: {
                        provider: true,
                    },
                },
            },
        })

        const hasOAuthProvider = userWithProviders?.authProviders.length ?? 0 > 0

        if (hasOAuthProvider && validatedData.email && validatedData.email !== userWithProviders?.email) {
            return NextResponse.json(
                { error: 'Нельзя изменить email для аккаунта, привязанного к соцсети' },
                { status: 400 }
            )
        }
        if (validatedData.email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: validatedData.email,
                    NOT: {
                        id: payload.userId
                    }
                }
            })

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Этот email уже используется другим пользователем' },
                    { status: 400 }
                )
            }
        }
        if (validatedData.phone) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    phone: validatedData.phone,
                    NOT: {
                        id: payload.userId
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

        const { notificationSettings, ...userData } = validatedData

        const updatedUser = await prisma.user.update({
            where: { id: payload.userId },
            data: {
                ...userData,
                name: validatedData.firstName ? `${validatedData.firstName}${validatedData.lastName ? ' ' + validatedData.lastName : ''}` : null,
                notificationSettings: notificationSettings ? {
                    upsert: {
                        create: notificationSettings,
                        update: notificationSettings
                    }
                } : undefined
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                birthDate: true,
                currency: true,
                timezone: true,
                region: true,
                notificationSettings: true,
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
