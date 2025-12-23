import { OnboardingStep } from '@/types/onboarding'

export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'dashboard-intro',
        title: 'Обзор ваших занятий и дохода',
        description: 'На этой странице вы сразу видите ближайшие занятия, неоплаченные уроки, количество учеников и общий доход за месяц.',
        page: '/dashboard',
        target: 'dashboard-stats',
        position: 'bottom'
    },
    {
        id: 'lessons-create',
        title: 'Создание и управление занятиями',
        description: 'Здесь можно создавать личные и групповые занятия, одноразовые и регулярные уроки, а также управлять статусом оплаты и редактировать информацию.',
        page: '/lessons',
        target: 'lessons-create-btn',
        position: 'bottom'
    },
    {
        id: 'students-list',
        title: 'Ученики и их история занятий',
        description: 'Каждому ученику соответствует детальная карточка с контактами, пройденными темами и всей историей занятий.',
        page: '/students',
        target: 'students-list',
        position: 'bottom'
    },
    {
        id: 'groups-list',
        title: 'Группы',
        description: 'Группы работают аналогично ученикам, позволяя вести занятия с несколькими людьми одновременно. В детальной странице группы хранится история всех занятий.',
        page: '/groups',
        target: 'groups-list',
        position: 'bottom'
    },
    {
        id: 'calendar-view',
        title: 'Календарь',
        description: 'Полноценный календарь показывает все занятия, доход по дням и позволяет управлять уроками прямо из него.',
        page: '/calendar',
        target: 'calendar-wrapper',
        position: 'top'
    },
    {
        id: 'income-analytics',
        title: 'Доходы и аналитика',
        description: 'Здесь вы видите полную статистику доходов, последние операции, долги учеников, а также графики доходов и занятий по месяцам.',
        page: '/income',
        target: 'income-stats',
        position: 'top'
    },
    {
        id: 'profile-region',
        title: 'Настройки профиля и региона',
        description: 'Укажите ваше имя и выберите регион — это позволит корректно показывать календарь с местными выходными и уведомления.',
        page: '/settings',
        target: 'profile-settings',
        position: 'top'
    },
    {
        id: 'bot-integration',
        title: 'Telegram-бот',
        description: 'Подключите Telegram-бота, чтобы получать уведомления о занятиях и оплатах синхронно с сайтом.',
        page: '/settings',
        target: 'telegram-integration',
        position: 'top'
    },
    {
        id: 'completed',
        title: 'Готово!',
        description: 'Вы завершили онбординг. Теперь можно полноценно работать с Tuterra.',
        page: '/dashboard',
        target: 'none',
        position: 'center'
    }
]