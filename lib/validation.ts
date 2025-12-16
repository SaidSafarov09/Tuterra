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

export function validateBirthDate(date: Date): { valid: boolean; error?: string } {
    if (isNaN(date.getTime())) {
        return { valid: false, error: 'Некорректная дата' }
    }
    const minYear = 1940
    const now = new Date()

    // Check min year
    if (date.getFullYear() < minYear) {
        return { valid: false, error: `Год рождения не может быть раньше ${minYear}` }
    }

    // Check strict past (cannot be today or future)
    // Compare dates only (ignore time)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (checkDate >= today) {
        return { valid: false, error: 'Дата рождения должна быть в прошлом' }
    }

    return { valid: true }
}

export function calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export function getAgeString(age: number): string {
    let count = age % 100;
    if (count >= 5 && count <= 20) {
        return `${age} лет`;
    }
    count = count % 10;
    if (count === 1) {
        return `${age} год`;
    }
    if (count >= 2 && count <= 4) {
        return `${age} года`;
    }
    return `${age} лет`;
}
