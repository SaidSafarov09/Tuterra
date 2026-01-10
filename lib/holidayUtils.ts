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
    // Russia
    'Новый год': 'С Новым годом! 🎉🎄',
    'Рождество Христово': 'С Рождеством Христовым! ✨🎁',
    'День защитника Отечества': 'С Днем защитника Отечества! 🪖🎖️',
    'Международный женский день': 'С Международным женским днем! 🌸💐',
    'Праздник Весны и Труда': 'С Праздником Весны и Труда! 🌷☀️',
    'День Победы': 'С Днем Победы! 🕊️🎖️',
    'День России': 'С Днем России! 🇷🇺🎆',
    'День народного единства': 'С Днем народного единства! 🤝🇷🇺',

    // Belarus
    'День Независимости': 'С Днем Независимости! 🇧🇾✨',
    'День Октябрьской революции': 'С Днем Октябрьской революции! 🚩',
    'День защитников Отечества и Вооруженных Сил Республики Беларусь': 'С Днем защитника Отечества! 🪖',

    // Kazakhstan
    'Наурыз мейрамы': 'Наурыз мейрамы құтты болсын! 🌸✨',
    'Қазақстан халқының бірлігі мерекесі': 'С Днем единства народа Казахстана! 🤝🇰🇿',
    'Отан қорғаушы күні': 'С Днем защитника Отечества! 🪖🇰🇿',
    'Астана күні': 'Астана күні құтты болсын! 🏙️🇰🇿',
    'Конституция күні': 'С Днем Конституции РК! 📜🇰🇿',
    'Республика күні': 'Республика күні құтты болсын! 🇰🇿✨',
    'Тәуелсіздік күні': 'С Днем Независимости Казахстана! 🇰🇿🎆',
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
        // ... (existing RU floating holidays)
        '2025-03-01': { 'RU-BU': 'С Сагаалганом! 🐲✨', 'RU-TY': 'С Шагаа! 🐲✨', 'RU-KL': 'С Цаган Саром! 🌸✨' },
        '2025-02-08': { 'RU-AL': 'С Чага-Байрамом! 🏔️✨' },
        '2025-04-29': { 'RU-AD': 'С Радоницей! 🕊️🕯️', 'BY': 'Радуница ✨' },
        '2025-04-21': { 'RU-CR': 'Светлое Христово Воскресение! 🥚✨' },
        '2025-06-09': { 'RU-CR': 'День Святой Троицы! 🌿✨' },
        '2025-07-18': { 'RU-TY': 'С Наадымом! 🐎🏹' }
    },
    2026: {
        '2026-03-20': { muslim: 'С Ураза-байрамом! 🌙✨' },
        '2026-05-27': { muslim: 'С Курбан-байрамом! 🕌🌙' },
        '2026-02-18': { 'RU-BU': 'С Сагаалганом! 🐲✨', 'RU-TY': 'С Шагаа! 🐲✨', 'RU-KL': 'С Цаган Саром! 🌸✨', 'RU-AL': 'С Чага-Байрамом! 🏔️✨' },
        '2026-04-21': { 'RU-AD': 'С Радоницей! 🕊️🕯️', 'BY': 'Радуница ✨' },
        '2026-04-13': { 'RU-CR': 'Светлое Христово Воскресение! 🥚✨' },
        '2026-06-01': { 'RU-CR': 'День Святой Троицы! 🌿✨' }
    }
}

const BY_FIXED_HOLIDAYS: Record<string, string> = {
    '01-01': 'С Новым годом! 🎄',
    '01-02': 'С Новым годом! 🎄',
    '01-07': 'С Рождеством Христовым! ✨',
    '03-08': 'С Международным женским днем! 🌸',
    '05-01': 'С Праздником труда! 🛠️',
    '05-09': 'С Днем Победы! 🕊️',
    '07-03': 'С Днем Независимости! 🇧🇾',
    '11-07': 'С Днем Октябрьской революции! 🚩',
    '12-25': 'С Рождеством Христовым (католи́ческим)! ✨'
}

const KZ_FIXED_HOLIDAYS: Record<string, string> = {
    '01-01': 'С Новым годом! 🎄',
    '01-02': 'С Новым годом! 🎄',
    '01-07': 'С Рождеством Христовым! ✨',
    '03-08': 'С Международным женским днем! 🌸',
    '03-21': 'Наурыз мейрамы! 🌸☀️',
    '03-22': 'Наурыз мейрамы! 🌸☀️',
    '03-23': 'Наурыз мейрамы! 🌸☀️',
    '05-01': 'С Праздником единства народа Казахстана! 🤝',
    '05-07': 'С Днем защитника Отечества! 🪖',
    '05-09': 'С Днем Победы! 🕊️',
    '07-06': 'С Днем Столицы! 🏙️',
    '08-30': 'С Днем Конституции! 📜',
    '10-25': 'С Днем Республики! 🇰🇿'
}


// Helper function to check for transferred holidays (weekend transfer)
const getTransferInfo = (date: Date, countryCode: string, year: number): { isHoliday: boolean, name?: string } => {
    if (countryCode !== 'BY' && countryCode !== 'KZ') return { isHoliday: false };

    // Only weekdays can be "transferred" holiday days
    const dayOfWeek = date.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) return { isHoliday: false };

    const fixed = countryCode === 'BY' ? BY_FIXED_HOLIDAYS : KZ_FIXED_HOLIDAYS;

    // Logic: If holiday falls on Sat or Sun, it moves to the NEXT working day.
    // If Sat was holiday -> Mon is off.
    // If Sun was holiday -> Mon is off.
    // If BOTH Sat and Sun were holidays -> Mon and Tue are off.

    if (dayOfWeek === 1) { // Monday
        // Check Sunday
        const sun = new Date(date); sun.setDate(date.getDate() - 1);
        const sunMMDD = format(sun, 'MM-dd');
        if (fixed[sunMMDD]) return { isHoliday: true, name: `Перенос (${fixed[sunMMDD]})` };

        // Check Saturday (only if Mon isn't already taking Sun's place? No, it's cumulative)
        // Wait, if Sat was a holiday, it transfers to Mon. If Sun was also a holiday, it transfers to Tue.
        const sat = new Date(date); sat.setDate(date.getDate() - 2);
        const satMMDD = format(sat, 'MM-dd');
        if (fixed[satMMDD]) return { isHoliday: true, name: `Перенос (${fixed[satMMDD]})` };
    }

    if (dayOfWeek === 2) { // Tuesday
        // Tuesday is off only if BOTH Sat and Sun were holidays
        const sun = new Date(date); sun.setDate(date.getDate() - 2);
        const sat = new Date(date); sat.setDate(date.getDate() - 3);
        const sunMMDD = format(sun, 'MM-dd');
        const satMMDD = format(sat, 'MM-dd');
        if (fixed[sunMMDD] && fixed[satMMDD]) return { isHoliday: true, name: `Перенос (${fixed[sunMMDD]})` };
    }

    // Special case for Mar 21-23 in KZ if they fall on Fri/Sat/Sun
    if (countryCode === 'KZ') {
        // This is simplified but covers most cases
    }

    return { isHoliday: false };
}

// Фиксированные региональные праздники (ТОЛЬКО если это выходной)
const REGIONAL_FIXED: Record<string, Record<string, string>> = {
    'RU-TA': { '08-30': 'С Днем Республики Татарстан! 🍎🏙️', '11-06': 'С Днем Конституции Татарстана! 📜🏗️' },
    'RU-BA': { '10-11': 'С Днем Республики Башкортостан! 🍯🐎' },
    'RU-DA': { '07-26': 'С Днем Конституции Дагестана! 🏔️📜', '09-15': 'С Днем единства народов Дагестана! 🤝🏙️' },
    'RU-AD': { '10-05': 'С Днем Республики Адыгея! 🌿⛰️' },
    'RU-AL': { '07-03': 'С Днем Республики Алтай! 🏔️🌲' },
    'RU-BU': { '05-30': 'С Днем Республики Бурятия! 🌊⛰️' },
    'RU-IN': { '06-04': 'С Днем Республики Ингушетия! 🗼⛰️' },
    'RU-KB': { '09-01': 'С Днем Республики Кабардино-Балкария! 🏔️🌸' },
    'RU-KL': { '07-05': 'С Днем Республики Калмыкия! ☸️🌷' },
    'RU-KC': { '05-26': 'С Днем Республики Карачаево-Черкесия! 🏔️✨' },
    'RU-KO': { '08-22': 'С Днем Республики Коми! 🌲🦅' },
    'RU-SA': { '04-27': 'С Днем Республики Саха (Якутия)! 💎❄️', '06-21': 'С праздником Ысыах! ☀️🥛' },
    'RU-TY': { '08-15': 'С Днем Республики Тыва! 🐎⛰️', '05-06': 'С Днем Конституции Республики Тыва! 📜🏙️' },
    'RU-KK': { '07-03': 'С Днем Республики Хакасия! 🗿🌾' },
    'RU-CE': { '03-23': 'С Днем Конституции Чеченской Республики! 🏔️📜' },
    'RU-CU': { '06-24': 'С Днем Республики Чувашия! 🌽🏢' },
    'RU-SE': { '09-20': 'С Днем Республики Северная Осетия — Алания! 🏔️🛡️' }
}

const NON_WORKING_REGIONAL: Set<string> = new Set([
    'RU-TA:08-30', 'RU-TA:11-06', 'RU-BA:10-11', 'RU-DA:07-26', 'RU-DA:09-15', 'RU-AD:10-05', 'RU-AL:07-03', 'RU-BU:05-30', 'RU-IN:06-04',
    'RU-KB:09-01', 'RU-KL:07-05', 'RU-KC:05-26', 'RU-KO:08-22', 'RU-SA:04-27', 'RU-SA:06-21', 'RU-TY:08-15', 'RU-TY:05-06', 'RU-KK:07-03',
    'RU-CE:03-23', 'RU-CU:06-24', 'RU-SE:09-20'
])

const hdRU = new Holidays('RU')
const hdBY = new Holidays('BY')
const hdKZ = new Holidays('KZ')

export const getDayInfo = (date: Date, userBirthDate?: string | null, countryCode?: string | null, region?: string | null): DayInfo => {
    const yyyymmdd = format(date, 'yyyy-MM-dd')
    const mmdd = format(date, 'MM-dd')
    const year = date.getFullYear()

    let activeHd = hdRU
    if (countryCode === 'BY') activeHd = hdBY
    else if (countryCode === 'KZ') activeHd = hdKZ

    const holidays = activeHd.isHoliday(date)
    let isHoliday = isDateWeekend(date)
    let holidayName: string | undefined

    // Check our custom fixed lists first to ensure accuracy
    if (countryCode === 'BY' && BY_FIXED_HOLIDAYS[mmdd]) {
        isHoliday = true
        holidayName = BY_FIXED_HOLIDAYS[mmdd]
    } else if (countryCode === 'KZ' && KZ_FIXED_HOLIDAYS[mmdd]) {
        isHoliday = true
        holidayName = KZ_FIXED_HOLIDAYS[mmdd]
    } else if (holidays && Array.isArray(holidays) && holidays.length > 0) {
        const mainHoliday = holidays.find(h => h.type === 'public') || holidays[0]
        holidayName = GREETING_MAPPING[mainHoliday.name] || (mainHoliday.name.includes('Новогодние каникулы') ? 'Новогодние каникулы!' : `${mainHoliday.name}!`)
        if (holidays.some(h => h.type === 'public')) isHoliday = true
    }

    // Check for transfers (BY/KZ)
    if (!isHoliday && (countryCode === 'BY' || countryCode === 'KZ')) {
        const transfer = getTransferInfo(date, countryCode, year)
        if (transfer.isHoliday) {
            isHoliday = true
            holidayName = transfer.name
        }
    }

    // Региональные / Вариативные праздники
    const varHolidays = VARIABLE_HOLIDAYS[year]?.[yyyymmdd]

    // Для Казахстана Курбан Айт - официальный выходной (muslim key в VARIABLE_HOLIDAYS)
    if (countryCode === 'KZ' && varHolidays?.muslim) {
        // Ураза-байрам в РК не всегда официальный выходной, но Курбан-айт - всегда.
        // VARIABLE_HOLIDAYS[year][date] содержит muslim ключ для обоих.
        // Уточнение: в Казахстане выходной ТОЛЬКО первый день Курбан-айта.
        const isKurbanAit = holidayName?.includes('Курбан') || varHolidays.muslim.includes('Курбан')
        if (isKurbanAit) {
            isHoliday = true
            holidayName = varHolidays.muslim
        }
    }

    // Для Беларуси Радуница - вариативный
    if (countryCode === 'BY' && varHolidays?.BY) {
        isHoliday = true
        holidayName = varHolidays.BY
    }

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

    let isShortened = (countryCode === 'RU' || !countryCode) && (SHORTENED_DAYS[year]?.has(yyyymmdd) || false)

    // Логика сокращенных дней (предпраздничных)
    if (!isShortened) {
        const tomorrow = new Date(date)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomMMDD = format(tomorrow, 'MM-dd')
        const tomYYYYMMDD = format(tomorrow, 'yyyy-MM-dd')
        const tomYear = tomorrow.getFullYear()
        const tomVar = VARIABLE_HOLIDAYS[tomYear]?.[tomYYYYMMDD]

        let isTomPublicHoliday = false

        if (countryCode === 'BY') {
            isTomPublicHoliday = !!BY_FIXED_HOLIDAYS[tomMMDD] || !!tomVar?.BY
        } else if (countryCode === 'KZ') {
            isTomPublicHoliday = !!KZ_FIXED_HOLIDAYS[tomMMDD] || (!!tomVar?.muslim && tomVar.muslim.includes('Курбан'))
        } else if (region) {
            // Логика сокращенных дней для регионов РФ
            isTomPublicHoliday = (NON_WORKING_REGIONAL.has(`${region}:${tomMMDD}`)) ||
                (!!tomVar && (!!tomVar[region] || (!!tomVar['muslim'] && MUSLIM_REPUBLICS.has(region))))
        }

        if (isTomPublicHoliday) {
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
