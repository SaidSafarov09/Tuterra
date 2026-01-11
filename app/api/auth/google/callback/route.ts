import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateOAuthUser, createAuthSession } from '@/lib/oauth'
import { prisma } from '@/lib/prisma'

interface GoogleUser {
    sub: string // Google user ID
    name: string
    given_name: string
    family_name: string
    picture: string
    email: string
    email_verified: boolean
    locale: string
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.redirect(new URL('/auth?error=no_code', req.url))
    }

    try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
            }),
        })

        const tokenData = await tokenResponse.json()
        if (!tokenData.access_token) {
            console.error('Google token error:', tokenData)
            return NextResponse.redirect(new URL('/auth?error=token_error', req.url))
        }

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        const googleUser: GoogleUser = await userResponse.json()

        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        const selectedRole = cookieStore.get('selected-role')?.value || 'teacher'

        const user = await findOrCreateOAuthUser({
            email: googleUser.email,
            phone: null,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name || '',
            avatar: googleUser.picture,
            birthDate: null,
            provider: 'google',
            providerId: googleUser.sub,
        }, selectedRole)

        // Handle referral linking (Unified logic)
        const sanitizeCode = (c: any) => {
            const s = c?.toString().trim()
            if (!s || s === 'null' || s === 'undefined' || s.length < 3) return null
            return s
        }

        const studentRef = sanitizeCode(cookieStore.get('student-referral-code')?.value)
        const teacherRef = sanitizeCode(cookieStore.get('referral-code')?.value)
        const partnerRef = sanitizeCode(cookieStore.get('partner_ref')?.value)

        const finalRefCode = teacherRef || partnerRef || studentRef

        if (finalRefCode && !user.invitedById && !(user as any).invitedByPartnerCode && !((user as any).partnerPaymentsCount > 0)) {
            try {
                const { linkStudentToTutor } = await import('@/lib/studentConnection')
                const { processTeacherReferral } = await import('@/lib/referral')

                const partner = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { partnerCode: finalRefCode.toUpperCase() },
                            { partnerCode: finalRefCode },
                            { partnerCode: finalRefCode.toLowerCase() }
                        ],
                        isPartner: true
                    }
                })

                if (partner && partner.id !== user.id) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            invitedByPartnerCode: partner.partnerCode,
                            invitedByPartnerAt: new Date()
                        } as any
                    })
                } else if (!partner) {
                    if (user.role === 'student') {
                        await linkStudentToTutor(user.id, finalRefCode)
                    } else {
                        await processTeacherReferral(user.id, finalRefCode)
                    }
                }
            } catch (e: any) {
                console.error('Referral linking error during OAuth:', e)
            }
            // Clear the referral cookies
            cookieStore.delete('referral-code')
            cookieStore.delete('student-referral-code')
            cookieStore.delete('partner_ref')
            cookieStore.delete('selected-role')
        }

        return createAuthSession(user.id, user.phone || '', req.url, user.role)

    } catch (error) {
        console.error('Google auth error:', error)
        return NextResponse.redirect(new URL('/auth?error=auth_failed', req.url))
    }
}
