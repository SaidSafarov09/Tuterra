import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendTelegramNotification } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

const groupSchema = z.object({
    name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
    subjectId: z.string().min(1, 'Выберите предмет'),
    studentIds: z.array(z.string()).optional(),
    note: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const groups = await prisma.group.findMany({
            where: { ownerId: payload.userId },
            include: {
                subject: true,
                students: true,
                lessons: {
                    orderBy: { date: 'desc' },
                    take: 1,
                },
                _count: {
                    select: { lessons: true, students: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(groups)
    } catch (error) {
        console.error('Get groups error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении списка групп' },
            { status: 500 }
        )
    }
}

import { FREE_LIMITS } from '@/lib/limits'

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { plan: true }
        })

        if (!user || user.plan !== 'pro') {
            const count = await prisma.group.count({
                where: { ownerId: payload.userId }
            })

            if (count >= FREE_LIMITS.groups) {
                return NextResponse.json(
                    { error: 'Достигнут лимит групп на бесплатном тарифе. Обновитесь до Pro.' },
                    { status: 403 }
                )
            }
        }

        const body = await request.json()
        const validatedData = groupSchema.parse(body)

        const group = await prisma.group.create({
            data: {
                name: validatedData.name,
                subjectId: validatedData.subjectId,
                note: validatedData.note,
                ownerId: payload.userId,
                students: validatedData.studentIds ? {
                    connect: validatedData.studentIds.map(id => ({ id }))
                } : undefined,
            },
            include: {
                subject: true,
                students: true,
            }
        })

        if (validatedData.studentIds && validatedData.studentIds.length > 0) {
            await prisma.subject.update({
                where: { id: validatedData.subjectId },
                data: {
                    students: {
                        connect: validatedData.studentIds.map(id => ({ id }))
                    }
                }
            }).catch(e => {
                console.error('Failed to link students to subject:', e)
            })
        }

        // Notify
        await sendTelegramNotification(payload.userId, `👥 **Новая группа:**\n\n**${group.name}**\nПредмет: ${group.subject.name}\nУчеников: ${group.students.length}`, 'statusChanges')

        return NextResponse.json(group, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Create group error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при создании группы' },
            { status: 500 }
        )
    }
}
