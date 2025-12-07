export type ContactType = 'phone' | 'telegram' | 'whatsapp'

export const CONTACT_TYPES: { type: ContactType; label: string }[] = [
    { type: 'phone', label: 'Телефон' },
    { type: 'telegram', label: 'Telegram' },
    { type: 'whatsapp', label: 'WhatsApp' },
]

export function validateContact(type: ContactType, value: string): boolean {
    if (!value) return true // Empty is valid (optional)

    switch (type) {
        case 'phone':
            // Basic phone validation: allows +, spaces, dashes, parentheses, digits
            return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(value)
        case 'telegram':
            return value.startsWith('t.me/') && value.length > 5
        case 'whatsapp':
            return value.startsWith('wa.me/') && value.length > 6
        default:
            return true
    }
}

export function getContactLink(type: ContactType, value: string): string {
    if (!value) return ''

    switch (type) {
        case 'phone':
            return `tel:${value}`
        case 'telegram':
            return `https://${value}` // value already has t.me/
        case 'whatsapp':
            return `https://${value}` // value already has wa.me/
        default:
            return value
    }
}

export function formatContactInput(type: ContactType, value: string): string {
    if (!value) return ''

    if (type === 'telegram') {
        if (value.startsWith('https://t.me/')) return value.replace('https://', '')
        if (value.startsWith('@')) return `t.me/${value.substring(1)}`
        if (!value.startsWith('t.me/')) return `t.me/${value}`
    }

    if (type === 'whatsapp') {
        if (value.startsWith('https://wa.me/')) return value.replace('https://', '')
        if (!value.startsWith('wa.me/')) return `wa.me/${value}`
    }

    return value
}

export function getContactPlaceholder(type: ContactType): string {
    switch (type) {
        case 'phone':
            return '+7 (999) 000-00-00'
        case 'telegram':
            return 't.me/username'
        case 'whatsapp':
            return 'wa.me/79990000000'
        default:
            return ''
    }
}
