import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    const scope = 'openid email profile'

    const googleAuthUrl = `https:

    return NextResponse.redirect(googleAuthUrl)
}
