import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.YANDEX_CLIENT_ID
    console.log('Yandex Client ID:', clientId)
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/yandex/callback`

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId || '',
        redirect_uri: redirectUri,
        scope: 'login:email login:info login:avatar login:birthday login:default_phone'
    })

    const yandexAuthUrl = `https://oauth.yandex.ru/authorize?${params.toString()}`

    return NextResponse.redirect(yandexAuthUrl)
}
