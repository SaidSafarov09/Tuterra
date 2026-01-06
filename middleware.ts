import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

export const runtime = 'nodejs'

const publicPaths = ['/auth', '/debug-auth', '/admin']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Helper to construct URL correctly regardless of environment
    const getTargetUrl = (path: string) => {
        // Try to get the base URL from env, headers, or fallback to a safe default
        let base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

        // If env is missing or points to internal IP, use request headers (standard for proxies)
        if (!base || base.includes('0.0.0.0') || base.includes('localhost')) {
            const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
            const proto = request.headers.get('x-forwarded-proto') || 'https';
            if (host && !host.includes('0.0.0.0')) {
                base = `${proto}://${host}`;
            }
        }

        // Final safety net to avoid 0.0.0.0
        if (!base || base.includes('0.0.0.0')) {
            base = 'https://tuterra.online';
        }

        const url = new URL(path, base)
        request.nextUrl.searchParams.forEach((value, key) => {
            url.searchParams.set(key, value)
        })
        return url
    }

    // 1. Landing Page logic
    if (pathname === '/') {
        const token = request.cookies.get('auth-token')?.value
        const payload = token ? await verifyToken(token) : null

        if (payload) {
            const target = payload?.role === 'student' ? '/student/dashboard' : '/dashboard'
            return NextResponse.redirect(getTargetUrl(target))
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

    if (isAuthenticated) {
        const targetDashboard = payload?.role === 'student' ? '/student/dashboard' : '/dashboard'

        // Redirect from public paths to specific dashboard, except for /admin which has its own auth
        if ((isPublicPath || pathname === '/') && !pathname.startsWith('/admin')) {
            return NextResponse.redirect(getTargetUrl(targetDashboard))
        }

        // Cross-role protection
        const isStudentPath = pathname.startsWith('/student/') || pathname === '/student'
        const isTeacherPath = pathname.startsWith('/dashboard') || pathname === '/dashboard'

        if (payload?.role === 'student' && isTeacherPath) {
            return NextResponse.redirect(getTargetUrl('/student/dashboard'))
        }
        if (payload?.role === 'teacher' && isStudentPath) {
            return NextResponse.redirect(getTargetUrl('/dashboard'))
        }
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
