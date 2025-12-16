import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.YANDEX_CLIENT_ID

    if (!clientId) {
        console.error('Missing YANDEX_CLIENT_ID')
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
        console.error('Missing NEXT_PUBLIC_APP_URL')
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const redirectUri = `${appUrl}/api/auth/yandex/callback`
    const scope = 'login:email login:info login:avatar login:birthday login:default_phone'

    // Yandex OAuth URL construction
    // Manually constructing to ensure scope format is exactly as expected (spaces encoded as %20, colons preserved)
    const yandexAuthUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope.replace(/ /g, '%20')}`

    console.log('Redirecting to Yandex Auth:', yandexAuthUrl)

    return NextResponse.redirect(yandexAuthUrl)
}
