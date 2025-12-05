'use client'

import { ThemeProvider } from '@/components/providers/ThemeProvider'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider attribute="data-theme">
            <div data-theme="light">
                {children}
            </div>
        </ThemeProvider>
    )
}
