import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const themeSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']),
})

export async function PUT(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value
        if (!token) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

        const body = await request.json()
        const { theme } = themeSchema.parse(body)

        await prisma.user.update({
            where: { id: payload.userId },
            data: { theme },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update theme error:', error)
        return NextResponse.json(
            { error: 'Не удалось обновить тему' },
            { status: 500 }
        )
    }
}
