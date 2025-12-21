import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) {
            return NextResponse.json({ connected: false }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload?.userId) {
            return NextResponse.json({ connected: false }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { telegramId: true }
        })

        return NextResponse.json({
            connected: !!user?.telegramId,
            telegramId: user?.telegramId
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        })
    } catch (error) {
        console.error('Telegram status check error:', error)
        return NextResponse.json({ connected: false }, { status: 500 })
    }
}
