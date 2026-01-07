import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { isPlanLocked } from '@/lib/guard'

export const dynamic = 'force-dynamic'

const topicSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Заголовок темы не может быть пустым'),
    description: z.string().optional().nullable(),
    order: z.number().default(0),
})

const planUpdateSchema = z.object({
    topics: z.array(topicSchema).optional(),
})


function enrichPlan(plan: any) {
    if (!plan) return null
    return {
        ...plan,
        topics: (plan.topics || []).map((topic: any) => ({
            ...topic,
            isCompleted: (topic._count?.lessons || 0) > 0,
            lastLesson: topic.lessons?.[0] || null
        }))
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const plan = await prisma.learningPlan.findFirst({
            where: {
                id: id,
                ownerId: payload.userId,
            },
            include: {
                topics: {
                    orderBy: { order: 'asc' },
                    include: {
                        _count: {
                            select: {
                                lessons: {
                                    where: { isCanceled: false }
                                }
                            }
                        },
                        lessons: {
                            where: { isCanceled: false },
                            orderBy: { date: 'desc' },
                            take: 1,
                            include: {
                                student: { select: { name: true } },
                                group: { select: { name: true } },
                                subject: { select: { name: true, color: true } }
                            }
                        }
                    }
                },
                student: {
                    include: {
                        linkedUser: true
                    }
                },
                group: true,
                subject: true,
            }
        })

        if (!plan) {
            return NextResponse.json({ error: 'План не найден' }, { status: 404 })
        }

        const planIsLocked = await isPlanLocked(plan.id, payload.userId)
        const enriched = enrichPlan(plan)

        return NextResponse.json({ ...enriched, isLocked: planIsLocked })
    } catch (error) {
        console.error('Get plan error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении плана' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const validatedData = planUpdateSchema.parse(body)

        const plan = await prisma.learningPlan.findFirst({
            where: {
                id: id,
                ownerId: payload.userId,
            },
            include: { topics: true }
        })

        if (!plan) {
            return NextResponse.json({ error: 'План не найден' }, { status: 404 })
        }

        if (await isPlanLocked(plan.id, payload.userId)) {
            return NextResponse.json(
                { error: 'Данный план заблокирован. Продлите Pro.' },
                { status: 403 }
            )
        }

        if (validatedData.topics) {
            const existingTopicIds = plan.topics.map(t => t.id)
            const incomingTopicIds = validatedData.topics.map(t => t.id).filter(Boolean) as string[]

            const toDelete = existingTopicIds.filter(id => !incomingTopicIds.includes(id))

            if (toDelete.length > 0) {
                await prisma.learningPlanTopic.deleteMany({
                    where: { id: { in: toDelete } }
                })
            }

            for (const topicData of validatedData.topics) {
                if (topicData.id) {
                    await prisma.learningPlanTopic.update({
                        where: { id: topicData.id },
                        data: {
                            title: topicData.title,
                            description: topicData.description,
                            order: topicData.order,
                        }
                    })
                } else {
                    await prisma.learningPlanTopic.create({
                        data: {
                            planId: id,
                            title: topicData.title,
                            description: topicData.description,
                            order: topicData.order,
                        }
                    })
                }
            }
        }

        const updatedPlan = await prisma.learningPlan.findUnique({
            where: { id: id },
            include: {
                topics: {
                    orderBy: { order: 'asc' },
                    include: {
                        _count: {
                            select: {
                                lessons: {
                                    where: { isCanceled: false }
                                }
                            }
                        },
                        lessons: {
                            where: { isCanceled: false },
                            orderBy: { date: 'desc' },
                            take: 1,
                            include: {
                                student: { select: { name: true } },
                                group: { select: { name: true } },
                                subject: { select: { name: true, color: true } }
                            }
                        }
                    }
                },
                subject: true,
                student: {
                    include: {
                        linkedUser: true
                    }
                },
                group: true,
            }
        })

        return NextResponse.json(enrichPlan(updatedPlan))
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        console.error('Update plan error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении плана' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const plan = await prisma.learningPlan.findFirst({
            where: {
                id: id,
                ownerId: payload.userId,
            }
        })

        if (!plan) {
            return NextResponse.json({ error: 'План не найден' }, { status: 404 })
        }

        if (await isPlanLocked(plan.id, payload.userId)) {
            return NextResponse.json(
                { error: 'Данный план заблокирован. Продлите Pro.' },
                { status: 403 }
            )
        }

        await prisma.learningPlan.delete({
            where: { id: id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete plan error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при удалении плана' },
            { status: 500 }
        )
    }
}
