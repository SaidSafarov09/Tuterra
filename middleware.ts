import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'


export const runtime = 'nodejs'

const publicPaths = ['/auth', '/debug-auth']
const protectedPaths = ['/dashboard', '/students', '/subjects', '/lessons', '/calendar', '/income', '/settings']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    
    if (pathname === '/') {
        const token = request.cookies.get('auth-token')?.value
        const payload = token ? await verifyToken(token) : null
        const isAuthenticated = payload !== null

        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/auth', request.url))
        }
    }

    
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    
    const token = request.cookies.get('auth-token')?.value

    
    const payload = token ? await verifyToken(token) : null
    const isAuthenticated = payload !== null

    
    if (isProtectedPath && !isAuthenticated) {
        const url = new URL('/auth', request.url)
        return NextResponse.redirect(url)
    }

    
    if (isPublicPath && isAuthenticated) {
        const url = new URL('/dashboard', request.url)
        return NextResponse.redirect(url)
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
