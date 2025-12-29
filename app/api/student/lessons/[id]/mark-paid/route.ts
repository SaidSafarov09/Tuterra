import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { sendTelegramNotification } from '@/lib/telegram'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'student') {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }

        const userId = payload.userId

        // Find student record(s) for this user
        const students = await prisma.student.findMany({
            where: { linkedUserId: userId },
            select: { id: true, name: true, ownerId: true }
        })

        if (students.length === 0) {
            return NextResponse.json({ error: 'Ученик не найден' }, { status: 404 })
        }

        const studentIds = students.map(s => s.id)

        // Find the lesson and ensure the student is part of it
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: id,
                OR: [
                    { studentId: { in: studentIds } },
                    { group: { students: { some: { id: { in: studentIds } } } } }
                ]
            },
            include: {
                student: true,
                group: { include: { students: true } },
                subject: true,
                owner: true
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Занятие не найдено' }, { status: 404 })
        }

        // For individual lesson
        if (lesson.studentId && studentIds.includes(lesson.studentId)) {
            await prisma.lesson.update({
                where: { id: lesson.id },
                data: { isPaid: true }
            })
        }

        // For group or individual, ensure LessonPayment exists and is marked as paid
        // Find which student record specifically is in this lesson/group
        let targetStudentId = lesson.studentId;
        if (lesson.groupId) {
            const studentInGroup = lesson.group?.students.find(s => studentIds.includes(s.id));
            if (studentInGroup) targetStudentId = studentInGroup.id;
        }

        if (targetStudentId) {
            await prisma.lessonPayment.upsert({
                where: {
                    lessonId_studentId: {
                        lessonId: lesson.id,
                        studentId: targetStudentId
                    }
                },
                update: { hasPaid: true },
                create: {
                    lessonId: lesson.id,
                    studentId: targetStudentId,
                    hasPaid: true
                }
            })
        }

        // Notify teacher
        const studentName = students[0].name || (payload as any).firstName || 'Ученик'
        const subjectName = lesson.subject?.name || 'Занятие'
        const dateStr = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(lesson.date))

        await sendTelegramNotification(
            lesson.ownerId,
            `💰 **Ученик отметил оплату:**\n\n**${studentName}** отметил, что оплатил занятие по предмету **${subjectName}** от ${dateStr}.`,
            'statusChanges'
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Mark paid error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при сохранении данных' },
            { status: 500 }
        )
    }
}
