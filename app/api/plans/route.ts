import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const planSchema = z.object({
    studentId: z.string().optional().nullable(),
    groupId: z.string().optional().nullable(),
    subjectId: z.string().optional().nullable(),
})

const topicInclude = {
    _count: {
        select: {
            lessons: {
                where: { isCanceled: false }
            }
        }
    },
    lessons: {
        where: { isCanceled: false },
        orderBy: { date: 'desc' } as const,
        take: 1,
        include: {
            student: { select: { name: true } },
            group: { select: { name: true } },
            subject: { select: { name: true, color: true } }
        }
    }
}

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

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('studentId')
        const subjectId = searchParams.get('subjectId')
        const groupId = searchParams.get('groupId')

        const plans = await prisma.learningPlan.findMany({
            where: {
                ownerId: payload.userId,
                ...(studentId ? { studentId } : {}),
                ...(subjectId ? { subjectId } : {}),
                ...(groupId ? { groupId } : {}),
            },
            include: {
                topics: {
                    orderBy: { order: 'asc' },
                    include: topicInclude
                },
                subject: true,
            }
        })

        const enrichedPlans = plans.map(enrichPlan)

        return NextResponse.json(enrichedPlans)
    } catch (error) {
        console.error('Get plans error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении планов' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const validatedData = planSchema.parse(body)

        let existingPlan = null

        if (validatedData.groupId) {
            existingPlan = await prisma.learningPlan.findUnique({
                where: { groupId: validatedData.groupId }
            })
        } else if (validatedData.studentId && validatedData.subjectId) {
            existingPlan = await prisma.learningPlan.findFirst({
                where: {
                    studentId: validatedData.studentId,
                    subjectId: validatedData.subjectId
                }
            })
        }

        if (existingPlan) {
            return NextResponse.json(existingPlan)
        }

        const plan = await prisma.learningPlan.create({
            data: {
                studentId: validatedData.studentId,
                subjectId: validatedData.subjectId,
                groupId: validatedData.groupId,
                ownerId: payload.userId,
            },
            include: {
                topics: true,
                subject: true,
            }
        })

        return NextResponse.json(plan, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        console.error('Create plan error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при создании плана' },
            { status: 500 }
        )
    }
}
