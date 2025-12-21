import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ru } from 'date-fns/locale'

export const formatSmartDate = (date: Date | string): string => {
    const d = new Date(date)

    // Fallback to Intl for precise time if needed, but browser usually handles local time well.
    // However, to be extra safe and consistent with the bot:
    const timeStr = new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit', minute: '2-digit'
    }).format(d)

    if (isToday(d)) {
        return `Сегодня, ${timeStr}`
    }

    if (isTomorrow(d)) {
        return `Завтра, ${timeStr}`
    }

    if (isYesterday(d)) {
        return `Вчера, ${timeStr}`
    }

    const dateStr = format(d, `dd MMMM`, { locale: ru })
    return `${dateStr}, ${timeStr}`
}

export const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) return `${mins} мин`
    if (mins === 0) return `${hours} ч`
    return `${hours} ч ${mins} мин`
}
