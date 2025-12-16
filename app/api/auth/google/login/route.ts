import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID

    if (!clientId) {
        console.error('Missing GOOGLE_CLIENT_ID')
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
        console.error('Missing NEXT_PUBLIC_APP_URL')
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const redirectUri = `${appUrl}/api/auth/google/callback`
    const scope = 'openid email profile'

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope.replace(/ /g, '%20')}&access_type=offline&prompt=consent`

    console.log('Redirecting to Google Auth:', googleAuthUrl)

    return NextResponse.redirect(googleAuthUrl)
}
