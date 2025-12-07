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

    if (type === 'phone') {
        let digits = value.replace(/\D/g, '')
        if (!digits) return ''
        if (digits[0] === '7' || digits[0] === '8') {
            digits = '7' + digits.substring(1)
        } else {
            digits = '7' + digits
        }
        digits = digits.substring(0, 11)
        let formatted = '+7'
        if (digits.length > 1) {
            formatted += ' (' + digits.substring(1, 4)
        }
        if (digits.length >= 5) {
            formatted += ') ' + digits.substring(4, 7)
        }
        if (digits.length >= 8) {
            formatted += '-' + digits.substring(7, 9)
        }
        if (digits.length >= 10) {
            formatted += '-' + digits.substring(9, 11)
        }

        return formatted
    }

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
