import { prisma } from '@/lib/prisma'

export async function createWelcomeNotifications(userId: string) {
    const notifications = [
        {
            userId,
            title: 'Добро пожаловать в Tuterra 🚀',
            message: 'Здесь вы сможете удобно управлять занятиями, учениками и доходами. Начните с обзора главной страницы - она покажет текущее состояние ваших дел.',
            type: 'system',
            link: '/dashboard'
        },
        {
            userId,
            title: 'Заполните профиль',
            message: 'Заполните до конца свой профиль и выберите регион в настройках. Это позволит календарю корректно учитывать региональные выходные и праздники.',
            type: 'profile_setup',
            link: '/settings'
        },
        {
            userId,
            title: 'Подключите Telegram-бота',
            message: 'Получайте уведомления о занятиях и оплатах прямо в Telegram - чтобы ничего не пропустить.',
            type: 'telegram_invite',
            link: '/settings#telegram-section'
        }
    ]
    await prisma.$transaction(
        notifications.map(data => prisma.notification.create({ data }))
    )
}
