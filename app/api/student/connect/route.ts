import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) {
            return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'student') {
            return NextResponse.json({ success: false, error: 'Доступ запрещен' }, { status: 403 })
        }

        const { referralCode } = await request.json()
        if (!referralCode) {
            return NextResponse.json({ success: false, error: 'Код не указан' }, { status: 400 })
        }

        // Find teacher by referral code
        const teacher = await prisma.user.findUnique({
            where: { referralCode: referralCode.toUpperCase() }
        })

        if (!teacher) {
            return NextResponse.json({ success: false, error: 'Преподаватель с таким кодом не найден' }, { status: 404 })
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        })

        if (!user) {
            return NextResponse.json({ success: false, error: 'Пользователь не найден' }, { status: 404 })
        }

        // Check if already connected
        const existingConnection = await prisma.student.findFirst({
            where: {
                ownerId: teacher.id,
                linkedUserId: user.id
            }
        })

        if (existingConnection) {
            return NextResponse.json({ success: false, error: 'Вы уже подключены к этому преподавателю' }, { status: 400 })
        }

        // Check if there is a student record for this user under this teacher with the same email/phone
        let studentRecord = await prisma.student.findFirst({
            where: {
                ownerId: teacher.id,
                OR: [
                    user.email ? { contact: user.email } : {},
                    user.phone ? { contact: user.phone } : {}
                ].filter(obj => Object.keys(obj).length > 0)
            }
        })

        if (studentRecord) {
            // Update existing record
            await prisma.student.update({
                where: { id: studentRecord.id },
                data: {
                    linkedUserId: user.id,
                    name: studentRecord.name || user.name || 'Ученик'
                }
            })
        } else {
            // Create new record
            await prisma.student.create({
                data: {
                    name: user.name || user.email?.split('@')[0] || 'Ученик',
                    ownerId: teacher.id,
                    linkedUserId: user.id,
                    contact: user.email || user.phone || '',
                    contactType: user.email ? 'email' : 'phone'
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Student connect error:', error)
        return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}
