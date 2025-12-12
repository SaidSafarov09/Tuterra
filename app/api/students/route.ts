import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateStudentSlug } from '@/lib/slugUtils'

export const dynamic = 'force-dynamic'

const studentSchema = z.object({
    name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
    contact: z.string().optional(),
    contactType: z.string().optional(),
    parentContact: z.string().optional(),
    parentContactType: z.string().optional(),
    note: z.string().optional(),
    subjectId: z.string().optional(),
    subjectName: z.string().optional(),
    groupId: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const students = await prisma.student.findMany({
            where: { ownerId: payload.userId },
            include: {
                subjects: true,
                lessons: {
                    orderBy: { date: 'desc' },
                    take: 1,
                },
                _count: {
                    select: { lessons: true },
                },
            } as any,
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

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const validatedData = studentSchema.parse(body)

        let subjectId = validatedData.subjectId

        if (!subjectId && validatedData.subjectName && validatedData.subjectName.trim()) {
            const name = validatedData.subjectName.trim()

            const existingSubject = await prisma.subject.findFirst({
                where: {
                    userId: payload.userId,
                    name: {
                        equals: name,
                    }
                }
            })

            if (existingSubject) {
                subjectId = existingSubject.id
            } else {


                const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
                const randomColor = colors[Math.floor(Math.random() * colors.length)]

                const newSubject = await prisma.subject.create({
                    data: {
                        name,
                        color: randomColor,
                        userId: payload.userId,
                    }
                })
                subjectId = newSubject.id
            }
        }

        const student = await prisma.student.create({
            data: {
                name: validatedData.name,
                contact: validatedData.contact,
                contactType: validatedData.contactType,
                parentContact: validatedData.parentContact,
                parentContactType: validatedData.parentContactType,
                note: validatedData.note,
                ownerId: payload.userId,
                subjects: subjectId ? {
                    connect: { id: subjectId }
                } : undefined,
                groups: validatedData.groupId ? {
                    connect: { id: validatedData.groupId }
                } : undefined,
            } as any,
        })


        const slug = generateStudentSlug(student.name, student.id)
        const updatedStudent = await prisma.student.update({
            where: { id: student.id },
            data: { slug }
        })

        return NextResponse.json(updatedStudent, { status: 201 })
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
