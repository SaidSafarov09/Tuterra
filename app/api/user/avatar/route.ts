import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const authUser = await getCurrentUser(request)

        if (!authUser) {
            return new NextResponse(null, { status: 401 })
        }

        const userData = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { avatar: true }
        })

        if (!userData?.avatar) {
            return new NextResponse(null, { status: 404 })
        }
        const matches = userData.avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)

        if (!matches || matches.length !== 3) {
            return new NextResponse('Invalid image data', { status: 500 })
        }

        const type = matches[1]
        const buffer = Buffer.from(matches[2], 'base64')

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': type,
                'Cache-Control': 'public, max-age=0, must-revalidate',
            }
        })
    } catch (error) {
        console.error('Avatar fetch error:', error)
        return new NextResponse(null, { status: 500 })
    }
}
