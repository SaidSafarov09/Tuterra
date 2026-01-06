import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

export const runtime = 'nodejs'

const publicPaths = ['/auth', '/debug-auth', '/admin']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Landing Page logic
    if (pathname === '/') {
        const token = request.cookies.get('auth-token')?.value
        const payload = token ? await verifyToken(token) : null

        if (payload) {
            const target = payload?.role === 'student' ? '/student/dashboard' : '/dashboard'
            const url = new URL(target, process.env.NEXTAUTH_URL || request.url)
            request.nextUrl.searchParams.forEach((value, key) => {
                url.searchParams.set(key, value)
            })
            return NextResponse.redirect(url)
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
        return NextResponse.redirect(new URL('/auth', process.env.NEXTAUTH_URL || request.url))
    }

    if (isAuthenticated) {
        const targetDashboard = payload?.role === 'student' ? '/student/dashboard' : '/dashboard'

        // Redirect from public paths to specific dashboard, except for /admin which has its own auth
        if ((isPublicPath || pathname === '/') && !pathname.startsWith('/admin')) {
            const url = new URL(targetDashboard, process.env.NEXTAUTH_URL || request.url)
            request.nextUrl.searchParams.forEach((value, key) => {
                url.searchParams.set(key, value)
            })
            return NextResponse.redirect(url)
        }

        // Cross-role protection
        const isStudentPath = pathname.startsWith('/student/') || pathname === '/student'
        const isTeacherPath = pathname.startsWith('/dashboard') || pathname === '/dashboard'

        if (payload?.role === 'student' && isTeacherPath) {
            const url = new URL('/student/dashboard', process.env.NEXTAUTH_URL || request.url)
            request.nextUrl.searchParams.forEach((value, key) => {
                url.searchParams.set(key, value)
            })
            return NextResponse.redirect(url)
        }
        if (payload?.role === 'teacher' && isStudentPath) {
            const url = new URL('/dashboard', process.env.NEXTAUTH_URL || request.url)
            request.nextUrl.searchParams.forEach((value, key) => {
                url.searchParams.set(key, value)
            })
            return NextResponse.redirect(url)
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
