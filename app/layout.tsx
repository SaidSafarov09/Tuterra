import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
    title: 'SkillTrack - CRM для репетиторов и коучей',
    description: 'Управляйте учениками и занятиями в одном месте',
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
