import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'student') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const userId = payload.userId

        // Get student records for this user
        const studentRecords = await prisma.student.findMany({
            where: { linkedUserId: userId },
            select: { id: true }
        })
        const studentIds = studentRecords.map(s => s.id)

        // Get groups where any of these student records are present
        const groups = await prisma.group.findMany({
            where: {
                students: {
                    some: {
                        id: { in: studentIds }
                    }
                }
            },
            include: {
                subject: true,
                students: true,
                _count: {
                    select: {
                        lessons: true,
                        students: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            groups
        })

    } catch (error) {
        console.error('Get student groups error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
