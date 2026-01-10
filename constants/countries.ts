export interface Country {
    value: string
    label: string
    currencies: string[]
    defaultCurrency: string
    timezones: { value: string; label: string }[]
    hasRegions: boolean
}

export const COUNTRIES: Country[] = [
    {
        value: 'RU',
        label: 'Россия',
        currencies: ['₽'],
        defaultCurrency: '₽',
        hasRegions: true,
        timezones: [
            { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
            { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
            { value: 'Europe/Samara', label: 'Самара (UTC+4)' },
            { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
            { value: 'Asia/Omsk', label: 'Омск (UTC+6)' },
            { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
            { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)' },
            { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)' },
            { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
            { value: 'Asia/Magadan', label: 'Магадан (UTC+11)' },
            { value: 'Asia/Kamchatka', label: 'Петропавловск-Камчатский (UTC+12)' },
        ]
    },
    {
        value: 'BY',
        label: 'Беларусь',
        currencies: ['BYN', 'USD'],
        defaultCurrency: 'BYN',
        hasRegions: false,
        timezones: [
            { value: 'Europe/Minsk', label: 'Минск (UTC+3)' }
        ]
    },
    {
        value: 'KZ',
        label: 'Казахстан',
        currencies: ['₸', 'USD'],
        defaultCurrency: '₸',
        hasRegions: false,
        timezones: [
            { value: 'Asia/Almaty', label: 'Алматы (UTC+5)' },
            { value: 'Asia/Qyzylorda', label: 'Кызылорда (UTC+5)' },
            { value: 'Asia/Aqtobe', label: 'Актобе (UTC+5)' },
            { value: 'Asia/Atyrau', label: 'Атырау (UTC+5)' },
            { value: 'Asia/Oral', label: 'Уральск (UTC+5)' }
        ]
    }
]

export const ALL_TIMEZONES = [
    ...COUNTRIES.flatMap(c => c.timezones),
    // Add some common global ones if needed, but the user asked for these 3 countries.
    // However, they said "if country not selected - show full list".
].filter((v, i, a) => a.findIndex(t => t.value === v.value) === i)
