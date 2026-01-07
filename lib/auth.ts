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
            select: {
                id: true,
                role: true,
                plan: true,
                proExpiresAt: true,
                // Add other needed fields if necessary, or just return full user
            }
        })

        return user as any
    } catch (error) {
        console.error('Get current user error:', error)
        return null
    }
}

export function isPro(user: { plan?: string | null, proExpiresAt?: Date | null }) {
    if (!user) return false
    if (user.plan !== 'pro') return false
    if (!user.proExpiresAt) return false
    return new Date(user.proExpiresAt) > new Date()
}

export async function verifyAuth(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value

        if (!token) {
            return null
        }

        const payload = await verifyToken(token)
        return payload
    } catch (error) {
        console.error('Verify auth error:', error)
        return null
    }
}
