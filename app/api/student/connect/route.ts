import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { linkStudentToTutor } from '@/lib/studentConnection'

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

        const student = await linkStudentToTutor(payload.userId, referralCode)

        if (!student) {
            return NextResponse.json({ success: false, error: 'Не удалось подключиться. Проверьте код.' }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof Error && error.message === 'Вы уже подключены к этому преподавателю') {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 })
        }
        console.error('Student connect error:', error)
        return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}


