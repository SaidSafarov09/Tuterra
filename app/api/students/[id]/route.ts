import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { isCuid } from '@/lib/slugUtils'

export const dynamic = 'force-dynamic'

const studentSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    contact: z.string().optional(),
    contactType: z.string().optional(),
    parentContact: z.string().optional(),
    parentContactType: z.string().optional(),
    note: z.string().optional(),
}).passthrough()

export async function GET(
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
            include: {
                subjects: true,
                groups: {
                    include: {
                        students: true,
                        lessons: {
                            orderBy: { date: 'desc' },
                            include: { subject: true, group: true, lessonPayments: true },
                        }
                    }
                },
                lessons: {
                    orderBy: { date: 'desc' },
                    include: { subject: true },
                },
                _count: {
                    select: { lessons: true },
                },
            } as any,
        })

        if (!student) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }


        if (isId && student.slug) {
            return NextResponse.redirect(
                new URL(`/students/${student.slug}`, request.url),
                { status: 301 }
            )
        }

        return NextResponse.json(student)
    } catch (error) {
        console.error('Get student error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении данных ученика' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request)
        const { id } = await params

        if (!user) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = studentSchema.parse(body)

        const isId = isCuid(id)
        const whereClause = isId
            ? { id: id, ownerId: user.id }
            : { slug: id, ownerId: user.id }

        const student = await prisma.student.updateMany({
            where: whereClause,
            data: validatedData,
        })

        if (student.count === 0) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        const updatedStudent = await prisma.student.findFirst({
            where: whereClause,
        })

        return NextResponse.json(updatedStudent)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Update student error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при обновлении ученика' },
            { status: 500 }
        )
    }
}

export async function DELETE(
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

        await prisma.student.update({
            where: { id: student.id },
            data: {
                subjects: {
                    set: []
                }
            }
        })

        const deleted = await prisma.student.deleteMany({
            where: {
                id: student.id,
                ownerId: user.id,
            },
        })

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete student error:', error)
        if (error instanceof Error && error.message.includes('foreign key constraint')) {
            return NextResponse.json(
                { error: 'Невозможно удалить ученика, так как с ним связаны другие данные' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Произошла ошибка при удалении ученика' },
            { status: 500 }
        )
    }
}
