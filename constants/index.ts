// Lesson tabs
export const LESSON_TABS = [
    { id: 'upcoming' as const, label: 'Предстоящие' },
    { id: 'past' as const, label: 'Прошедшие' },
    { id: 'unpaid' as const, label: 'Неоплаченные' },
    { id: 'canceled' as const, label: 'Отмененные' },
]

// Subject colors
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

// Status colors
export const STATUS_COLORS = {
    paid: '#10B981',
    unpaid: '#f97316',
    canceled: '#EF4444',
} as const

// Week days
export const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
