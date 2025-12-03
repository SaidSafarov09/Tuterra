import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function getCurrentUser(request: NextRequest) {
    try {
        // Get token from cookie
        const token = request.cookies.get('auth-token')?.value

        if (!token) {
            return null
        }

        // Verify token
        const payload = await verifyToken(token)

        if (!payload) {
            return null
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
        })

        return user
    } catch (error) {
        console.error('Get current user error:', error)
        return null
    }
}
