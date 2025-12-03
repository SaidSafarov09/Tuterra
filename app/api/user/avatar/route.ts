import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const user = await getCurrentUser(request)

        if (!user) {
            return new NextResponse(null, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: user.id },
            select: { avatar: true }
        })

        if (!user?.avatar) {
            return new NextResponse(null, { status: 404 })
        }

        // Парсим base64 строку: "data:image/png;base64,..."
        const matches = user.avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)

        if (!matches || matches.length !== 3) {
            // Если формат не base64, возможно это просто URL (хотя у нас сохраняется base64)
            // В таком случае можно сделать редирект, но пока предположим base64
            return new NextResponse('Invalid image data', { status: 500 })
        }

        const type = matches[1]
        const buffer = Buffer.from(matches[2], 'base64')

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': type,
                'Cache-Control': 'public, max-age=0, must-revalidate', // Не кэшируем жестко, чтобы видеть обновления
            }
        })
    } catch (error) {
        console.error('Avatar fetch error:', error)
        return new NextResponse(null, { status: 500 })
    }
}
