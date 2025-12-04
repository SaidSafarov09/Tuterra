import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

// Use Node.js runtime instead of Edge runtime for crypto support
export const runtime = 'nodejs'

const publicPaths = ['/auth', '/debug-auth']
const protectedPaths = ['/dashboard', '/students', '/subjects', '/lessons', '/calendar', '/income', '/settings']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Debug logging (remove after fixing production issue)
    const token = request.cookies.get('auth-token')?.value
    console.log('[Middleware]', {
        pathname,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    })

    // Handle root path
    if (pathname === '/') {
        const payload = token ? await verifyToken(token) : null
        const isAuthenticated = payload !== null

        console.log('[Middleware] Root path:', { isAuthenticated, payload: payload ? 'valid' : 'invalid' })

        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/auth', request.url))
        }
    }

    // Check if path is protected
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // Verify token
    const payload = token ? await verifyToken(token) : null
    const isAuthenticated = payload !== null

    console.log('[Middleware] Auth check:', {
        pathname,
        isProtectedPath,
        isPublicPath,
        isAuthenticated,
        payloadValid: !!payload
    })

    // Redirect to auth if trying to access protected route without auth
    if (isProtectedPath && !isAuthenticated) {
        console.log('[Middleware] Redirecting to /auth - no valid token')
        const url = new URL('/auth', request.url)
        return NextResponse.redirect(url)
    }

    // Redirect to dashboard if trying to access auth page while authenticated
    if (isPublicPath && isAuthenticated) {
        console.log('[Middleware] Redirecting to /dashboard - already authenticated')
        const url = new URL('/dashboard', request.url)
        return NextResponse.redirect(url)
    }

    console.log('[Middleware] Allowing request to proceed')
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
