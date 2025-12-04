'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePathname, useRouter } from 'next/navigation'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, login } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        // Skip auth check for public pages
        if (pathname === '/auth') {
            setIsLoading(false)
            return
        }

        // If user is already in store, no need to fetch
        if (user && isAuthenticated) {
            setIsLoading(false)
            return
        }

        // Try to restore session from cookie
        async function restoreSession() {
            try {
                const response = await fetch('/api/auth/me')
                const data = await response.json()

                if (data.success && data.user) {
                    // Restore user to store (token is in httpOnly cookie)
                    login('', data.user) // Token is not needed in store, it's in cookie
                } else {
                    // No valid session, redirect to auth if on protected page
                    if (pathname !== '/auth') {
                        router.push('/auth')
                    }
                }
            } catch (error) {
                console.error('Failed to restore session:', error)
                if (pathname !== '/auth') {
                    router.push('/auth')
                }
            } finally {
                setIsLoading(false)
            }
        }

        restoreSession()
    }, [pathname, user, isAuthenticated, login, router])

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--background)'
            }}>
                <div style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                }}>
                    Загрузка...
                </div>
            </div>
        )
    }

    return <>{children}</>
}
