import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'student') {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }

        // Find all students linked to this user
        const linkedStudents = await prisma.student.findMany({
            where: { linkedUserId: payload.userId },
            include: {
                subjects: {
                    include: {
                        user: {
                            select: { name: true, firstName: true }
                        },
                        _count: {
                            select: { lessons: true }
                        }
                    }
                }
            }
        })

        // Extract unique subjects
        const subjectsMap = new Map();
        linkedStudents.forEach(student => {
            student.subjects.forEach(subject => {
                if (!subjectsMap.has(subject.id)) {
                    subjectsMap.set(subject.id, {
                        ...subject,
                        teacherName: subject.user?.name || subject.user?.firstName || 'Преподаватель'
                    });
                }
            });
        });

        const subjects = Array.from(subjectsMap.values());

        return NextResponse.json(subjects)
    } catch (error) {
        console.error('Get student subjects error:', error)
        return NextResponse.json(
            { error: 'Произошла ошибка при получении списка предметов' },
            { status: 500 }
        )
    }
}
