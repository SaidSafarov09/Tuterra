import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
    title: 'Tuterra - CRM для репетиторов и коучей',
    description: 'Управляйте учениками, расписанием и доходами',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
}

import { ThemeProvider } from '@/components/providers/ThemeProvider'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body>
                <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
                    {children}
                    <Toaster position="bottom-right" richColors />
                </ThemeProvider>
            </body>
        </html>
    )
}
