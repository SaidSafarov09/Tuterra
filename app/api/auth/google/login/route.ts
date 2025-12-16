import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    const scope = 'openid email profile'

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId || '',
        redirect_uri: redirectUri,
        scope: scope,
        access_type: 'offline',
        prompt: 'consent'
    })

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.redirect(googleAuthUrl)
}
