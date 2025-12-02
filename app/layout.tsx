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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ru">
            <body>
                {children}
                <Toaster position="bottom-right" richColors />
            </body>
        </html>
    )
}
