import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCuid } from '@/lib/slugUtils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const topicSchema = z.object({
    title: z.string().min(1, 'Заголовок обязателен'),
    description: z.string().optional(),
    order: z.number().optional(),
    isCompleted: z.boolean().optional(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = await params

        if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const isId = isCuid(id)
        const student = await prisma.student.findFirst({
            where: isId ? { id: id, ownerId: user.id } : { slug: id, ownerId: user.id },
            select: { id: true }
        })

        if (!student) return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })

        const topics = await prisma.learningPlanTopic.findMany({
            where: { studentId: student.id },
            orderBy: { order: 'asc' }
        })

        return NextResponse.json(topics)
    } catch (error) {
        console.error('Get plan error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = await params
        if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const isId = isCuid(id)
        const student = await prisma.student.findFirst({
            where: isId ? { id: id, ownerId: user.id } : { slug: id, ownerId: user.id },
            select: { id: true }
        })
        if (!student) return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })

        const body = await request.json()
        const validated = topicSchema.parse(body)

        const lastTopic = await prisma.learningPlanTopic.findFirst({
            where: { studentId: student.id },
            orderBy: { order: 'desc' }
        })
        const nextOrder = (lastTopic?.order ?? -1) + 1

        const topic = await prisma.learningPlanTopic.create({
            data: {
                ...validated,
                studentId: student.id,
                order: validated.order ?? nextOrder
            }
        })

        return NextResponse.json(topic)
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        console.error('Post plan error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = await params
        if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const { topics } = body as { topics: { id: string, order: number }[] }

        if (!topics || !Array.isArray(topics)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        // Parallel updates for reordering
        await Promise.all(
            topics.map(t => prisma.learningPlanTopic.update({
                where: { id: t.id },
                data: { order: t.order }
            }))
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Patch plan error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
