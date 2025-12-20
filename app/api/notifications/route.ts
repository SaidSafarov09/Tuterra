import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const notifications = await prisma.notification.findMany({
            where: { userId: payload.userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error('Get notifications error:', error)
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
    }
}
