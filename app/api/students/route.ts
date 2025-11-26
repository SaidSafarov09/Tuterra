import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const studentSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    contact: z.string().optional(),
    note: z.string().optional(),
})

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const students = await prisma.student.findMany({
            where: { ownerId: session.user?.id },
            include: {
                lessons: {
                    orderBy: { date: 'desc' },
                    take: 1,
                },
                _count: {
                    select: { lessons: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(students)
    } catch (error) {
        console.error('Get students error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении списка учеников' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = studentSchema.parse(body)

        const student = await prisma.student.create({
            data: {
                ...validatedData,
                ownerId: session.user?.id,
            },
        })

        return NextResponse.json(student, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        console.error('Create student error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при создании ученика' },
            { status: 500 }
        )
    }
}
