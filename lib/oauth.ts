import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { NextResponse } from 'next/server'
import { createWelcomeNotifications } from '@/lib/welcomeNotifications'

interface CreateUserParams {
    email: string | null
    phone: string | null
    firstName: string
    lastName: string
    avatar: string | null
    birthDate: Date | null
    provider: string
    providerId: string
}


export function formatPhoneForDB(rawPhone: string | null | undefined): string | null {
    if (!rawPhone) return null

    if (rawPhone.startsWith('+')) {
        return rawPhone
    } else if (rawPhone.startsWith('7') || rawPhone.startsWith('8')) {
        return '+' + (rawPhone.startsWith('8') ? '7' + rawPhone.substring(1) : rawPhone)
    } else {
        return '+7' + rawPhone
    }
}


export async function findOrCreateOAuthUser(params: CreateUserParams) {
    const { email, phone, firstName, lastName, avatar, birthDate, provider, providerId } = params


    let user = await prisma.user.findFirst({
        where: {
            authProviders: {
                some: {
                    provider,
                    providerId,
                },
            },
        },
    })

    if (user) return user


    const formattedPhone = formatPhoneForDB(phone)

    user = await prisma.user.findFirst({
        where: {
            OR: [
                email ? { email } : null,
                formattedPhone ? { phone: formattedPhone } : null,
            ].filter(Boolean) as any,
        },
    })

    if (user) {

        await prisma.authProvider.create({
            data: {
                userId: user.id,
                provider,
                providerId,
            },
        })

        // Update user if needed (e.g. fill missing birthdate)
        if (birthDate && !(user as any).birthDate) {
            await prisma.user.update({
                where: { id: user.id },
                data: { birthDate } as any
            })
        }

        return user
    }


    user = await prisma.user.create({
        data: {
            email,
            phone: formattedPhone,
            firstName,
            lastName,
            birthDate,
            name: `${firstName} ${lastName}`.trim(),
            avatar,
            emailVerified: !!email,
            phoneVerified: !!formattedPhone,
            referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            authProviders: {
                create: {
                    provider,
                    providerId,
                },
            },
        } as any,
    })

    // Создаем приветственные уведомления для нового пользователя
    await createWelcomeNotifications(user.id)

    return user
}

import { cookies } from 'next/headers'

export async function createAuthSession(userId: string, phone: string, requestUrl: string, role: string = 'teacher') {
    try {
        let finalRole = role
        // Auto-link any matching student records
        try {
            const { autoLinkByContact } = await import('@/lib/studentConnection')
            await autoLinkByContact(userId)

            // Refetch user to get the latest role after auto-link
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    role: true,
                    isPartner: true,
                    _count: { select: { lessons: true, students: true } }
                }
            })
            if (user) finalRole = user.role
            var isPartner = user?.isPartner || false
            var lessonsCount = user?._count?.lessons || 0
            var studentsCount = user?._count?.students || 0
        } catch (e) {
            console.error('Auto-linking error during OAuth:', e)
            // Fallback
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPartner: true } })
            var isPartner = user?.isPartner || false
            var lessonsCount = 0
            var studentsCount = 0
        }

        // Logic to determine Start Page
        let startPage = finalRole === 'student' ? '/student/dashboard' : '/dashboard';
        if (isPartner && finalRole === 'teacher') {
            if (lessonsCount === 0 && studentsCount === 0) {
                startPage = '/partner';
            }
        }

        const token = await signToken({
            userId,
            phone: phone || '',
            role: finalRole,
            isPartner: isPartner,
            startPage
        })

        if (!token) {
            throw new Error('Failed to generate JWT token')
        }

        const isLocalhost = requestUrl.includes('localhost')
        const secure = !isLocalhost

        const cookieOptions = {
            httpOnly: true,
            secure: secure,
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        }

        const cookieStore = await cookies()
        cookieStore.set('auth-token', token, cookieOptions)

        // Robust redirect URL construction
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || requestUrl
        // Use the calculated startPage!
        let targetPath = startPage

        const redirectUrl = new URL(targetPath, baseUrl)

        return NextResponse.redirect(redirectUrl)
    } catch (error) {
        console.error(`[OAuth] Fatal error in createAuthSession:`, error)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || requestUrl
        return NextResponse.redirect(new URL('/auth?error=session_error', baseUrl))
    }
}
