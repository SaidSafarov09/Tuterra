import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCuid } from '@/lib/slugUtils'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = await params

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const isId = isCuid(id)
        const whereClause = isId
            ? { id: id, ownerId: user.id }
            : { slug: id, ownerId: user.id }

        const student = await prisma.student.findFirst({
            where: whereClause,
        })

        if (!student) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        if (!student.linkedUserId) {
            return NextResponse.json({ error: 'Ученик не привязан к платформе' }, { status: 400 })
        }

        await prisma.student.update({
            where: { id: student.id },
            data: {
                linkedUserId: null
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unlink student error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при отвязке ученика' },
            { status: 500 }
        )
    }
}
