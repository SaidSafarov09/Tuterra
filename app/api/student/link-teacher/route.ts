import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'student') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { code } = await request.json()
        if (!code) return NextResponse.json({ success: false, error: 'Код не указан' }, { status: 400 })

        const teacher = await prisma.user.findUnique({
            where: { referralCode: code.toUpperCase() }
        })

        if (!teacher) {
            return NextResponse.json({ success: false, error: 'Преподаватель с таким кодом не найден' }, { status: 404 })
        }

        const userId = payload.userId
        const currentUser = await prisma.user.findUnique({ where: { id: userId } })

        // Check if already linked
        const existingLink = await prisma.student.findFirst({
            where: {
                ownerId: teacher.id,
                linkedUserId: userId
            }
        })

        if (existingLink) {
            return NextResponse.json({ success: false, error: 'Вы уже подключены к этому преподавателю' }, { status: 400 })
        }

        // Create link
        await prisma.student.create({
            data: {
                name: currentUser?.name || 'Новый ученик',
                ownerId: teacher.id,
                linkedUserId: userId,
                contact: currentUser?.email || currentUser?.phone,
                contactType: currentUser?.email ? 'email' : 'phone'
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Link teacher error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
