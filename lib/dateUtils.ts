import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ru } from 'date-fns/locale'

export const formatSmartDate = (date: Date | string): string => {
    const d = new Date(date)

    if (isToday(d)) {
        return `Сегодня, ${format(d, 'HH:mm', { locale: ru })}`
    }

    if (isTomorrow(d)) {
        return `Завтра, ${format(d, 'HH:mm', { locale: ru })}`
    }

    if (isYesterday(d)) {
        return `Вчера, ${format(d, 'HH:mm', { locale: ru })}`
    }

    return format(d, 'dd MMMM yyyy, HH:mm', { locale: ru })
}

export const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) return `${mins} мин`
    if (mins === 0) return `${hours} ч`
    return `${hours} ч ${mins} мин`
}
