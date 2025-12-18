import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

export const runtime = 'nodejs'

const publicPaths = ['/auth', '/debug-auth']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Landing Page logic
    if (pathname === '/') {
        const token = request.cookies.get('auth-token')?.value
        const payload = token ? await verifyToken(token) : null

        if (payload) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        return NextResponse.next()
    }

    // 2. Auth check
    const token = request.cookies.get('auth-token')?.value
    const payload = token ? await verifyToken(token) : null
    const isAuthenticated = payload !== null

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // 3. Redirect logic
    if (!isPublicPath && !isAuthenticated) {
        return NextResponse.redirect(new URL('/auth', request.url))
    }

    if (isPublicPath && isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api routes
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
