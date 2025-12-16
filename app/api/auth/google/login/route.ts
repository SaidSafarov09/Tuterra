import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    const scope = 'openid email profile'

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope.replace(/ /g, '%20')}&access_type=offline&prompt=consent`

    return NextResponse.redirect(googleAuthUrl)
}
