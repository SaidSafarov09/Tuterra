'use client'

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Suspense } from 'react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider attribute="data-theme">
            <div data-theme="light">
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </div>
        </ThemeProvider>
    )
}
