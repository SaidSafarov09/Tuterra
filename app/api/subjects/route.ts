import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const subjectSchema = z.object({
    name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
    color: z.string().default('#4A6CF7'),
    icon: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const subjects = await prisma.subject.findMany({
            where: { userId: user.id },
            include: {
                _count: {
                    select: { students: true, lessons: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(subjects)
    } catch (error) {
        console.error('Get subjects error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении списка предметов' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = subjectSchema.parse(body)

        // Проверяем, не существует ли уже предмет с таким именем
        const existing = await prisma.subject.findFirst({
            where: {
                userId: user.id,
                name: validatedData.name,
            },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Предмет с таким названием уже существует' },
                { status: 400 }
            )
        }

        const subject = await prisma.subject.create({
            data: {
                ...validatedData,
                userId: user.id,
            },
        })

        return NextResponse.json(subject, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Create subject error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при создании предмета' },
            { status: 500 }
        )
    }
}
