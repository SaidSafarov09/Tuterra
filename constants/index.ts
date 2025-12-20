export const LESSON_TABS = [
    { id: 'upcoming' as const, label: 'Ближайшие' },
    { id: 'past' as const, label: 'Прошедшие' },
    { id: 'unpaid' as const, label: 'Неоплаченные' },
    { id: 'canceled' as const, label: 'Отмененные' },
]

export const SUBJECT_COLORS = [
    '#4A6CF7',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
]

export const STATUS_COLORS = {
    paid: '#10B981',
    unpaid: '#f97316',
    canceled: '#EF4444',
} as const

export const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const TABS = [
    { id: 'general', label: 'Основные' },
    { id: 'notifications', label: 'Уведомления' },
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

export const REGIONS = [
    { value: 'all', label: 'РФ (федеральные праздники)' },
    { value: 'RU-AD', label: 'Республика Адыгея' },
    { value: 'RU-AL', label: 'Республика Алтай' },
    { value: 'RU-BA', label: 'Республика Башкортостан' },
    { value: 'RU-BU', label: 'Республика Бурятия' },
    { value: 'RU-DA', label: 'Республика Дагестан' },
    { value: 'RU-IN', label: 'Республика Ингушетия' },
    { value: 'RU-KB', label: 'Кабардино-Балкарская Республика' },
    { value: 'RU-KL', label: 'Республика Калмыкия' },
    { value: 'RU-KC', label: 'Карачаево-Черкесская Республика' },
    { value: 'RU-KR', label: 'Республика Карелия' },
    { value: 'RU-KO', label: 'Республика Коми' },
    { value: 'RU-CR', label: 'Республика Крым' },
    { value: 'RU-ME', label: 'Республика Марий Эл' },
    { value: 'RU-MO', label: 'Республика Мордовия' },
    { value: 'RU-SA', label: 'Республика Саха (Якутия)' },
    { value: 'RU-SE', label: 'Республика Северная Осетия - Алания' },
    { value: 'RU-TA', label: 'Республика Татарстан' },
    { value: 'RU-TY', label: 'Республика Тыва' },
    { value: 'RU-UD', label: 'Удмуртская Республика' },
    { value: 'RU-KK', label: 'Республика Хакасия' },
    { value: 'RU-CE', label: 'Чеченская Республика' },
    { value: 'RU-CU', label: 'Чувашская Республика' },
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
    'Неравенства с модулем',
    'Past Continuous',
    'Разбор тестовой части ОГЭ',
    'Сложение и вычитание дробей',
    'Сочинение по литературе',
    'Основы алгоритмизации',
    'Векторы и скалярное произведение',
    'Future Perfect',
    'Анализ исторического источника',
    'Логарифмические уравнения',
    'Разбор карты по географии',
    'Закон Архимеда',
    'Подготовка к контрольной работе',
    'Построение графиков функций',
    'Условные предложения',
    'Строение клетки',
    'Типы социализации',
    'Спрос и предложение',
    'Русский язык: пунктуация в сложных предложениях',
    'IELTS Speaking Practice',
    'Основы синтаксиса',
    'Орфография: Н и НН',
    'Признаки равенства треугольников',
    'Великая Отечественная война',
    'Квадратный корень',
    'ENEM Reading Practice',
    'Анализ стихотворения'
]