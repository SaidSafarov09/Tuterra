import type { Metadata } from 'next'
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
            <body>{children}</body>
        </html>
    )
}
