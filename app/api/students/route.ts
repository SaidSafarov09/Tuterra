import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const studentSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    contact: z.string().optional(),
    note: z.string().optional(),
    subjectId: z.string().optional(),
    subjectName: z.string().optional(),
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
                subjects: true,
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

        let subjectId = validatedData.subjectId

        // If subjectName is provided but no subjectId, find or create the subject
        if (!subjectId && validatedData.subjectName && validatedData.subjectName.trim()) {
            const name = validatedData.subjectName.trim()

            // Try to find existing subject by name for this user
            const existingSubject = await prisma.subject.findFirst({
                where: {
                    userId: session.user.id,
                    name: {
                        equals: name,
                    } // Case sensitive check usually, but prisma might be configured otherwise. 
                    // For now exact match.
                }
            })

            if (existingSubject) {
                subjectId = existingSubject.id
            } else {
                // Create new subject
                // Generate a random color for the new subject
                const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
                const randomColor = colors[Math.floor(Math.random() * colors.length)]

                const newSubject = await prisma.subject.create({
                    data: {
                        name,
                        color: randomColor,
                        userId: session.user.id,
                    }
                })
                subjectId = newSubject.id
            }
        }

        const student = await prisma.student.create({
            data: {
                name: validatedData.name,
                contact: validatedData.contact,
                note: validatedData.note,
                ownerId: session.user.id,
                subjects: subjectId ? {
                    connect: { id: subjectId }
                } : undefined,
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
