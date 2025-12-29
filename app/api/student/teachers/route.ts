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
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true
                    }
                }
            }
        })

        // Map and unique by owner id
        const teachersMap = new Map()
        studentRecords.forEach(record => {
            if (record.owner) {
                teachersMap.set(record.owner.id, record.owner)
            }
        })

        const teachers = Array.from(teachersMap.values())

        return NextResponse.json({
            success: true,
            teachers
        })

    } catch (error) {
        console.error('Get student teachers error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
