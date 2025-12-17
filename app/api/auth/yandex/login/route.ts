import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.YANDEX_CLIENT_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!clientId || !appUrl) {
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const redirectUri = `${appUrl}/api/auth/yandex/callback`
    const scope = 'login:email login:info login:avatar login:birthday login:default_phone'

    const yandexAuthUrl =
        'https://oauth.yandex.ru/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope,
        }).toString()

    return NextResponse.redirect(yandexAuthUrl)
}