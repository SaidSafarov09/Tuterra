import type { Metadata, Viewport } from 'next'
import { ToasterProvider } from '@/components/providers/ToasterProvider'
import './globals.css'

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export const metadata: Metadata = {
    title: 'Tuterra — CRM-система для репетиторов и коучей',
    description: 'Масштабируйте свой талант с Tuterra. Умное расписание, учет оплат и контроль прогресса учеников в одном месте. Начните бесплатно прямо сейчас!',
    keywords: ['репетитор', 'органайзер', 'учет оплат', 'Tuterra', 'ученик', 'преподаватель'],
    openGraph: {
        title: 'Tuterra — Современный органайзер для репетиторов и коучей',
        description: 'Удобный инструмент для ведения расписания, учета оплат и контроля прогресса учеников. Попробуйте бесплатно!',
        url: 'https://www.tuterra.online',
        siteName: 'Tuterra',
        images: [
            {
                url: 'https://www.tuterra.online/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Tuterra — органайзер для репетиторов',
            },
        ],
        type: 'website',
    },
    alternates: {
        canonical: 'https://www.tuterra.online/',
    },
    icons: {
        icon: '/icon.svg',
        apple: '/icon.svg',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
}

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Suspense } from 'react'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body>
                <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
                    <Suspense fallback={null}>
                        <ProgressBar />
                    </Suspense>
                    {children}
                    <ToasterProvider />
                </ThemeProvider>
            </body>
        </html>
    )
}
