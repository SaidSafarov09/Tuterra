import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

export const runtime = 'nodejs'

const publicPaths = ['/auth', '/debug-auth', '/admin', '/oferta', '/policy', '/soglasie']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    const proto = request.headers.get('x-forwarded-proto') || 'https'

    // 0. Capture Referral Codes (Standard & Partner)
    const ref = request.nextUrl.searchParams.get('ref')
    const inviteRef = request.nextUrl.searchParams.get('inviteRef')

    if (ref || inviteRef) {
        const cleanUrl = new URL(pathname, request.url)
        // Preserve other params if needed, but usually we want a clean landing
        // request.nextUrl.searchParams.forEach((v, k) => { if (k!=='ref' && k!=='inviteRef') cleanUrl.searchParams.set(k, v) })

        const response = NextResponse.redirect(cleanUrl)

        // Standard Referral (Teacher -> Teacher)
        if (ref) {
            response.cookies.set('referral-code', ref, { path: '/', maxAge: 60 * 60 * 24 * 60 }) // 60 days
        }

        // Partner Referral (Partner -> User)
        if (inviteRef) {
            response.cookies.set('partner_ref', inviteRef, { path: '/', maxAge: 60 * 60 * 24 * 90 }) // 90 days
        }

        return response
    }

    // 1. Redirect www to non-www
    if (host.startsWith('www.')) {
        const newHost = host.replace('www.', '')
        const newUrl = new URL(pathname + request.nextUrl.search, `https://${newHost}`)
        return NextResponse.redirect(newUrl, 301)
    }

    // 2. Construction of the base URL for redirects
    const baseUrl = host && !host.includes('0.0.0.0') && !host.includes('localhost')
        ? `${proto}://${host}`
        : (process.env.NEXTAUTH_URL || request.url)

    const getTargetUrl = (target: string) => {
        const url = new URL(target, baseUrl)
        request.nextUrl.searchParams.forEach((value, key) => {
            url.searchParams.set(key, value)
        })
        return url
    }

    // 3. Landing Page logic
    if (pathname === '/') {
        const token = request.cookies.get('auth-token')?.value
        const payload = token ? await verifyToken(token) : null

        if (payload) {
            if ((payload as any).startPage) {
                return NextResponse.redirect(getTargetUrl((payload as any).startPage))
            }
            const target = payload?.role === 'student' ? '/student/dashboard' : '/dashboard'
            return NextResponse.redirect(getTargetUrl(target))
        }
        return NextResponse.next()
    }

    // 4. Auth check
    const token = request.cookies.get('auth-token')?.value
    const payload = token ? await verifyToken(token) : null
    const isAuthenticated = payload !== null

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // 5. Redirect logic
    if (!isPublicPath && !isAuthenticated) {
        return NextResponse.redirect(getTargetUrl('/auth'))
    }

    if (isAuthenticated) {
        let targetDashboard = payload?.role === 'student' ? '/student/dashboard' : '/dashboard'

        // Intelligent Redirection based on token's calculated start page (uses activity check)
        if ((payload as any)?.startPage) {
            targetDashboard = (payload as any).startPage
        }
        // Fallback for older tokens: conservative approach, prefer dashboard for hybrids
        // We remove the aggressive 'isPartner' check here because newer logins will have 'startPage'
        // and older logins (without startPage) are likely existing users who should go to dashboard.

        // Redirect from public paths to specific dashboard, except for /admin and legal pages
        const isLegalPath = ['/oferta', '/policy', '/soglasie'].includes(pathname)
        if ((isPublicPath || pathname === '/') && !pathname.startsWith('/admin') && !isLegalPath) {
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
