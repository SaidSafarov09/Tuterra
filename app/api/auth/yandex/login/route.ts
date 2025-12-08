import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.YANDEX_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/yandex/callback`
    const scope = 'login:email login:info login:avatar login:birthday login:default_phone'

    const yandexAuthUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`

    return NextResponse.redirect(yandexAuthUrl)
}
