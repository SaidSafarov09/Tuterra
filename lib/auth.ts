import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function getCurrentUser(request: NextRequest) {
    try {
        
        const token = request.cookies.get('auth-token')?.value

        if (!token) {
            return null
        }

        
        const payload = await verifyToken(token)

        if (!payload) {
            return null
        }

        
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
        })

        return user
    } catch (error) {
        console.error('Get current user error:', error)
        return null
    }
}
