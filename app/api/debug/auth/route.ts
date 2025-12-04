import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value
    const hasToken = !!token

    let tokenValid = false
    let tokenPayload = null
    let error = null

    if (token) {
        try {
            tokenPayload = await verifyToken(token)
            tokenValid = !!tokenPayload
        } catch (e) {
            error = e instanceof Error ? e.message : 'Unknown error'
        }
    }

    return NextResponse.json({
        hasToken,
        tokenValid,
        tokenPayload,
        error,
        env: {
            nodeEnv: process.env.NODE_ENV,
            hasJwtSecret: !!process.env.JWT_SECRET,
            jwtSecretLength: process.env.JWT_SECRET?.length || 0,
        },
        cookies: {
            all: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
        }
    })
}
