import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { NextResponse } from 'next/server'

interface CreateUserParams {
    email: string | null
    phone: string | null
    firstName: string
    lastName: string
    avatar: string | null
    provider: string
    providerId: string
}

/**
 * Format phone number to standard format (+7...)
 */
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

/**
 * Find or create user from OAuth provider
 */
export async function findOrCreateOAuthUser(params: CreateUserParams) {
    const { email, phone, firstName, lastName, avatar, provider, providerId } = params

    // 1. Check if user already linked to this provider
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

    // 2. Try to find existing user by email or phone to link accounts
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
        // Link existing user to provider
        await prisma.authProvider.create({
            data: {
                userId: user.id,
                provider,
                providerId,
            },
        })
        return user
    }

    // 3. Create new user
    user = await prisma.user.create({
        data: {
            email,
            phone: formattedPhone,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim(),
            avatar,
            emailVerified: !!email,
            phoneVerified: !!formattedPhone,
            authProviders: {
                create: {
                    provider,
                    providerId,
                },
            },
        },
    })

    return user
}

/**
 * Create auth session and redirect to dashboard
 */
export async function createAuthSession(userId: string, phone: string, requestUrl: string) {
    const token = await signToken({
        userId,
        phone: phone || '',
    })

    const response = NextResponse.redirect(new URL('/dashboard', requestUrl))
    response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    })

    return response
}
