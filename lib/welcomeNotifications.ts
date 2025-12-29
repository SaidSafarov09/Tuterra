import { prisma } from '@/lib/prisma'

export async function createWelcomeNotifications(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    })
    const isStudent = user?.role === 'student'

    const notifications = isStudent ? [
        {
            userId,
            title: 'Добро пожаловать в Tuterra! 👋',
            message: 'Здесь ваше актуальное расписание и учебные материалы. Подключитесь к преподавателю, чтобы увидеть свои занятия.',
            type: 'system',
            link: '/student/dashboard'
        },
        {
            userId,
            title: 'Настройте уведомления',
            message: 'Мы будем напоминать вам о занятиях и оплатах. Настройте уведомления в профиле, чтобы не пропустить важное.',
            type: 'profile_setup',
            link: '/settings?tab=notifications'
        }
    ] : [
        {
            userId,
            title: 'Добро пожаловать в Tuterra 🚀',
            message: 'Здесь вы сможете удобно управлять занятиями, учениками и доходами. Начните с обзора главной страницы.',
            type: 'system',
            link: '/dashboard'
        },
        {
            userId,
            title: 'Заполните профиль',
            message: 'Выберите регион в настройках для учета праздников в календаре.',
            type: 'profile_setup',
            link: '/settings'
        },
        {
            userId,
            title: 'Подключите Telegram',
            message: 'Получайте уведомления о занятиях прямо в Telegram.',
            type: 'telegram_invite',
            link: '/settings#telegram-section'
        }
    ]

    await prisma.$transaction(
        notifications.map(data => prisma.notification.create({ data }))
    )
}
