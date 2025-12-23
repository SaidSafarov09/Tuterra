'use client'

import React, { useEffect } from 'react'
import { useOnboardingStore } from '@/hooks/useOnboardingStore'
import { OnboardingOverlay } from './OnboardingOverlay'

interface OnboardingProviderProps {
    children: React.ReactNode
    userOnboardingCompleted?: boolean;
}

export function OnboardingProvider({ children, userOnboardingCompleted }: OnboardingProviderProps) {
    const { start, isCompleted, reset } = useOnboardingStore()

    useEffect(() => {
        const shouldStart = userOnboardingCompleted === false && !isCompleted

        if (shouldStart) {
            const timer = setTimeout(() => {
                start()
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [userOnboardingCompleted, isCompleted, start])

    return (
        <>
            {children}
            <OnboardingOverlay />
        </>
    )
}
