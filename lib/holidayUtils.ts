import Holidays from 'date-holidays'
import { isWeekend as isDateWeekend, format } from 'date-fns'

export interface DayInfo {
    isHoliday: boolean
    isShortened: boolean
    holidayName?: string
    isBirthday?: boolean
}

const hd = new Holidays('RU')

const GREETING_MAPPING: Record<string, string> = {
    'Новый год': 'С Новым годом! 🎉🎄',
    'Рождество Христово': 'С Рождеством Христовым! ✨🎁',
    'День защитника Отечества': 'С Днем защитника Отечества! 🪖🎖️',
    'Международный женский день': 'С Международным женским днем! 🌸💐',
    'Праздник Весны и Труда': 'С Праздником Весны и Труда! 🌷☀️',
    'День Победы': 'С Днем Победы! 🕊️🎖️',
    'День России': 'С Днем России! 🇷🇺🎆',
    'День народного единства': 'С Днем народного единства! 🤝🇷🇺',
}

const SHORTENED_DAYS: Record<number, Set<string>> = {
    2025: new Set(['2025-03-07', '2025-04-30', '2025-06-11', '2025-11-01']),
    2026: new Set(['2026-04-30', '2026-05-08', '2026-06-11', '2026-11-03']),
}

const MUSLIM_REPUBLICS = new Set(['RU-TA', 'RU-BA', 'RU-CE', 'RU-DA', 'RU-IN', 'RU-KC', 'RU-KB', 'RU-AD', 'RU-CR'])
const BUDDHIST_REPUBLICS = new Set(['RU-BU', 'RU-AL', 'RU-TY', 'RU-KL'])

// Плавающие (религиозные / национальные) праздники по годам
const VARIABLE_HOLIDAYS: Record<number, Record<string, Record<string, string>>> = {
    2025: {
        '2025-03-30': { muslim: 'С Ураза-байрамом! 🌙✨' },
        '2025-06-06': { muslim: 'С Курбан-байрамом! 🕌🌙' },

        // Буддийский Новый год (выходной в регионах)
        '2025-03-01': {
            'RU-BU': 'С Сагаалганом! 🐲✨',
            'RU-TY': 'С Шагаа! 🐲✨',
            'RU-KL': 'С Цаган Саром! 🌸✨'
        },

        // Алтай
        '2025-02-08': { 'RU-AL': 'С Чага-Байрамом! 🏔️✨' },

        // Адыгея — Радоница (официальный выходной)
        '2025-04-29': { 'RU-AD': 'С Радоницей! 🕊️🕯️' },

        // Крым — Пасха и Троица выходные
        '2025-04-21': { 'RU-CR': 'Светлое Христово Воскресение! 🥚✨' },
        '2025-06-09': { 'RU-CR': 'День Святой Троицы! 🌿✨' },

        // Тыва — Наадым
        '2025-07-18': { 'RU-TY': 'С Наадымом! 🐎🏹' }
    },

    2026: {
        '2026-03-20': { muslim: 'С Ураза-байрамом! 🌙✨' },
        '2026-05-27': { muslim: 'С Курбан-байрамом! 🕌🌙' },

        '2026-02-18': {
            'RU-BU': 'С Сагаалганом! 🐲✨',
            'RU-TY': 'С Шагаа! 🐲✨',
            'RU-KL': 'С Цаган Саром! 🌸✨',
            'RU-AL': 'С Чага-Байрамом! 🏔️✨'
        },

        '2026-05-19': { 'RU-AD': 'С Радоницей! 🕊️🕯️' },

        '2026-04-13': { 'RU-CR': 'Светлое Христово Воскресение! 🥚✨' },
        '2026-06-01': { 'RU-CR': 'День Святой Троицы! 🌿✨' }
    }
}

// Фиксированные региональные праздники (ТОЛЬКО если это выходной)
const REGIONAL_FIXED: Record<string, Record<string, string>> = {
    'RU-TA': {
        '08-30': 'С Днем Республики Татарстан! 🍎🏙️',
        '11-06': 'С Днем Конституции Татарстана! 📜🏗️'
    },
    'RU-BA': {
        '10-11': 'С Днем Республики Башкортостан! 🍯🐎'
    },
    'RU-DA': {
        '07-26': 'С Днем Конституции Дагестана! 🏔️📜',
        '09-15': 'С Днем единства народов Дагестана! 🤝🏙️'
    },
    'RU-AD': {
        '10-05': 'С Днем Республики Адыгея! 🌿⛰️'
    },
    'RU-AL': {
        '07-03': 'С Днем Республики Алтай! 🏔️🌲'
    },
    'RU-BU': {
        '05-30': 'С Днем Республики Бурятия! 🌊⛰️'
    },
    'RU-IN': {
        '06-04': 'С Днем Республики Ингушетия! 🗼⛰️'
    },
    'RU-KB': {
        '09-01': 'С Днем Республики Кабардино-Балкария! 🏔️🌸'
    },
    'RU-KL': {
        '07-05': 'С Днем Республики Калмыкия! ☸️🌷'
    },
    'RU-KC': {
        '05-26': 'С Днем Республики Карачаево-Черкесия! 🏔️✨'
    },
    'RU-KO': {
        '08-22': 'С Днем Республики Коми! 🌲🦅'
    },
    'RU-SA': {
        '04-27': 'С Днем Республики Саха (Якутия)! 💎❄️',
        '06-21': 'С праздником Ысыах! ☀️🥛'
    },
    'RU-TY': {
        '08-15': 'С Днем Республики Тыва! 🐎⛰️',
        '05-06': 'С Днем Конституции Республики Тыва! 📜🏙️'
    },
    'RU-KK': {
        '07-03': 'С Днем Республики Хакасия! 🗿🌾'
    },
    'RU-CE': {
        '03-23': 'С Днем Конституции Чеченской Республики! 🏔️📜'
    },
    'RU-CU': {
        '06-24': 'С Днем Республики Чувашия! 🌽🏢'
    },
    'RU-SE': {
        '09-20': 'С Днем Республики Северная Осетия — Алания! 🏔️🛡️'
    }
}

// Реестр НЕРАБОЧИХ региональных дней
const NON_WORKING_REGIONAL: Set<string> = new Set([
    'RU-TA:08-30', 'RU-TA:11-06',
    'RU-BA:10-11',
    'RU-DA:07-26', 'RU-DA:09-15',
    'RU-AD:10-05',
    'RU-AL:07-03',
    'RU-BU:05-30',
    'RU-IN:06-04',
    'RU-KB:09-01',
    'RU-KL:07-05',
    'RU-KC:05-26',
    'RU-KO:08-22',
    'RU-SA:04-27', 'RU-SA:06-21',
    'RU-TY:08-15', 'RU-TY:05-06',
    'RU-KK:07-03',
    'RU-CE:03-23',
    'RU-CU:06-24',
    'RU-SE:09-20'
])

export const getDayInfo = (date: Date, userBirthDate?: string | null, region?: string | null): DayInfo => {
    const yyyymmdd = format(date, 'yyyy-MM-dd')
    const mmdd = format(date, 'MM-dd')
    const year = date.getFullYear()

    const holidays = hd.isHoliday(date)
    let isHoliday = isDateWeekend(date)
    let holidayName: string | undefined

    if (holidays && Array.isArray(holidays) && holidays.length > 0) {
        const mainHoliday = holidays.find(h => h.type === 'public') || holidays[0]
        holidayName = GREETING_MAPPING[mainHoliday.name] || (mainHoliday.name.includes('Новогодние каникулы') ? 'Новогодние каникулы!' : `${mainHoliday.name}!`)
        if (holidays.some(h => h.type === 'public')) isHoliday = true
    }

    const varHolidays = VARIABLE_HOLIDAYS[year]?.[yyyymmdd]
    if (region && varHolidays) {
        if (varHolidays['muslim'] && MUSLIM_REPUBLICS.has(region)) {
            isHoliday = true
            holidayName = varHolidays['muslim']
        } else if (varHolidays[region]) {
            holidayName = varHolidays[region]
            isHoliday = true
        }
    }

    if (region && REGIONAL_FIXED[region]?.[mmdd]) {
        holidayName = REGIONAL_FIXED[region][mmdd]
        if (NON_WORKING_REGIONAL.has(`${region}:${mmdd}`)) {
            isHoliday = true
        }
    }

    let isShortened = SHORTENED_DAYS[year]?.has(yyyymmdd) || false
    if (!isShortened && region) {
        const tomorrow = new Date(date)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomMMDD = format(tomorrow, 'MM-dd')
        const tomYYYYMMDD = format(tomorrow, 'yyyy-MM-dd')
        const tomYear = tomorrow.getFullYear()
        const tomVar = VARIABLE_HOLIDAYS[tomYear]?.[tomYYYYMMDD]

        const isTomRegionalNonWorkingHoliday =
            (NON_WORKING_REGIONAL.has(`${region}:${tomMMDD}`)) ||
            (!!tomVar && (!!tomVar[region] || (!!tomVar['muslim'] && MUSLIM_REPUBLICS.has(region))))

        if (isTomRegionalNonWorkingHoliday) {
            isShortened = true
        }
    }

    if (isShortened && isDateWeekend(date)) {
        isShortened = false
    }

    let isBirthday = false
    if (userBirthDate) {
        const birthDateObj = new Date(userBirthDate)
        if (format(date, 'MM-dd') === format(birthDateObj, 'MM-dd')) {
            isBirthday = true
        }
    }

    return {
        isHoliday,
        isShortened,
        holidayName,
        isBirthday
    }
}

export const getRandomColor = () => {
    const colors = [
        '#F87171', // red
        '#FB923C', // orange
        '#FBBF24', // amber
        '#34D399', // emerald
        '#60A5FA', // blue
        '#818CF8', // indigo
        '#A78BFA', // violet
        '#F472B6', // pink
    ]
    return colors[Math.floor(Math.random() * colors.length)]
}
