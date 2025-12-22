import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const topicSchema = z.object({
    title: z.string().min(1, 'Заголовок обязателен').optional(),
    description: z.string().optional(),
    isCompleted: z.boolean().optional(),
})

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, topicId: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { topicId } = await params
        if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const validated = topicSchema.parse(body)

        const topic = await prisma.learningPlanTopic.update({
            where: { id: topicId },
            data: validated
        })

        return NextResponse.json(topic)
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        console.error('Patch topic error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, topicId: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { topicId } = await params
        if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        await prisma.learningPlanTopic.delete({
            where: { id: topicId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete topic error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
