export function validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+7\d{10}$/
    return phoneRegex.test(phone)
}

export function formatPhoneNumber(phone: string): string {
    
    let cleaned = phone.replace(/[^\d+]/g, '')

    
    if (cleaned.startsWith('+7')) {
        return cleaned.substring(0, 12)
    }

    
    cleaned = cleaned.replace(/\+/g, '')

    
    if (cleaned.startsWith('7') || cleaned.startsWith('8')) {
        cleaned = '+7' + cleaned.substring(1)
    } else if (cleaned) {
        cleaned = '+7' + cleaned
    } else {
        return '+7'
    }

    return cleaned.substring(0, 12)
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function capitalizeFirstLetter(str: string): string {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function isSingleWord(str: string): boolean {
    return str.trim().split(/\s+/).length === 1
}

export function validateAndFormatName(name: string): { valid: boolean; formatted: string; error?: string } {
    const trimmed = name.trim()

    if (!trimmed) {
        return { valid: false, formatted: '', error: 'Поле не может быть пустым' }
    }

    if (!isSingleWord(trimmed)) {
        return { valid: false, formatted: trimmed, error: 'Должно быть одно слово без пробелов' }
    }

    const formatted = capitalizeFirstLetter(trimmed)
    return { valid: true, formatted }
}
