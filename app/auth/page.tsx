'use client'

import { AuthContainer } from '@/components/auth/AuthContainer'
import { useAuthStore } from '@/store/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function AuthContent() {
    const { isAuthenticated, user } = useAuthStore()
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (isAuthenticated) {
            const plan = searchParams.get('plan')
            const target = user?.role === 'student' ? '/student/dashboard' : '/dashboard'
            const redirectUrl = plan ? `${target}?plan=${plan}` : target
            router.push(redirectUrl)
        }
    }, [isAuthenticated, router, searchParams, user])

    if (isAuthenticated) {
        return null
    }

    return <AuthContainer />
}

export default function AuthPage() {
    return (
        <Suspense fallback={null}>
            <AuthContent />
        </Suspense>
    )
}
