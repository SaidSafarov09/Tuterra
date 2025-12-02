export const LESSON_TABS = [
    { id: 'upcoming' as const, label: 'Предстоящие' },
    { id: 'past' as const, label: 'Прошедшие' },
    { id: 'unpaid' as const, label: 'Неоплаченные' },
    { id: 'canceled' as const, label: 'Отмененные' },
]

export const SUBJECT_COLORS = [
    '#4A6CF7', // Синий
    '#10B981', // Зеленый
    '#F59E0B', // Оранжевый
    '#EF4444', // Красный
    '#8B5CF6', // Фиолетовый
    '#EC4899', // Розовый
    '#14B8A6', // Бирюзовый
    '#F97316', // Оранжево-красный
]

export const STATUS_COLORS = {
    paid: '#10B981',
    unpaid: '#f97316',
    canceled: '#EF4444',
} as const

export const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const TABS = [
    { id: 'general', label: 'Основные' },
    { id: 'appearance', label: 'Оформление' },
]

export const TIMEZONES = [
    { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
    { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
    { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
    { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
    { value: 'Asia/Omsk', label: 'Омск (UTC+6)' },
    { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
    { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
    { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
    { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
]

export const stringToColor = (str: string): string => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    const hue = Math.abs(hash % 360)
    return `hsl(${hue}, 65%, 55%)`
}

export const getInitials = (name?: string | null) => {
    if (!name) return '?'
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export const LESSON_TOPIC_EXAMPLES = [
    'Present Simple',
    'Квадратные уравнения',
    'Подготовка к ЕГЭ',
    'Введение в React',
    'Глагол to be',
    'Тригонометрия',
    'Эссе по обществознанию',
]