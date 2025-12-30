'use client'

import { AuthContainer } from '@/components/auth/AuthContainer'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthPage() {
    const { isAuthenticated } = useAuthStore()
    const router = useRouter()

    useEffect(() => {

        if (isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, router])

    if (isAuthenticated) {
        return null
    }

    return <AuthContainer />
}
