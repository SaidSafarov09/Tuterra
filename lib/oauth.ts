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
    const { email, phone, firstName, lastName, avatar, provider, providerId } = params

    
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
        return user
    }

    
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
        maxAge: 60 * 60 * 24 * 7, 
        path: '/',
    })

    return response
}
