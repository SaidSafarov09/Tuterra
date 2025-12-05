import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateOAuthUser, createAuthSession } from '@/lib/oauth'

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
        // 1. Exchange code for token
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

        // 2. Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        const googleUser: GoogleUser = await userResponse.json()

        // 3. Find or create user
        const user = await findOrCreateOAuthUser({
            email: googleUser.email,
            phone: null, // Google doesn't provide phone in basic scope
            firstName: googleUser.given_name,
            lastName: googleUser.family_name || '',
            avatar: googleUser.picture,
            provider: 'google',
            providerId: googleUser.sub,
        })

        // 4. Create session and redirect
        return createAuthSession(user.id, user.phone || '', req.url)

    } catch (error) {
        console.error('Google auth error:', error)
        return NextResponse.redirect(new URL('/auth?error=auth_failed', req.url))
    }
}
