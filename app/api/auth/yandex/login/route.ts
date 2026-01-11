import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const ref = searchParams.get('ref')
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

    const studentRef = searchParams.get('refStudent')
    const teacherRef = searchParams.get('ref')

    const response = NextResponse.redirect(yandexAuthUrl)
    const role = searchParams.get('role') || 'teacher'

    if (studentRef) {
        response.cookies.set('student-referral-code', studentRef, { maxAge: 3600, path: '/' })
        response.cookies.set('selected-role', 'student', { maxAge: 3600, path: '/' })
    } else if (teacherRef) {
        response.cookies.set('referral-code', teacherRef, { maxAge: 3600, path: '/' })
        response.cookies.set('selected-role', 'teacher', { maxAge: 3600, path: '/' })
    } else if (role) {
        response.cookies.set('selected-role', role, { maxAge: 3600, path: '/' })
    }

    // Clear referral cookies if not in URL
    if (!studentRef && !teacherRef) {
        response.cookies.delete('referral-code')
        response.cookies.delete('student-referral-code')
    }

    return response
}