/**
 * Transliteration map: Cyrillic → Latin
 */
const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
}

/**
 * Transliterate Cyrillic to Latin
 */
function transliterate(text: string): string {
    return text
        .split('')
        .map(char => translitMap[char] || char)
        .join('')
}

/**
 * Generate URL-friendly slug from input string
 * @param input - Input string (e.g., name, title)
 * @param extra - Optional extra string to append for uniqueness
 * @returns URL-friendly slug
 */
export function generateSlug(input: string, extra?: string): string {
    let slug = transliterate(input)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except -
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '')             // Trim - from end

    if (extra) {
        slug += `-${extra}`
    }

    return slug
}

/**
 * Generate slug for student
 * @param name - Student name
 * @param id - Student ID (last 6 chars for uniqueness)
 */
export function generateStudentSlug(name: string, id: string): string {
    const uniqueSuffix = id.slice(-6)
    return generateSlug(name, uniqueSuffix)
}

/**
 * Generate slug for lesson
 * @param studentName - Student name
 * @param date - Lesson date
 * @param topic - Optional lesson topic
 */
export function generateLessonSlug(studentName: string, date: Date, topic?: string): string {
    const dateStr = date.toISOString().slice(0, 16).replace('T', '-').replace(/:/g, '-')
    const base = topic || studentName
    return generateSlug(base, dateStr)
}

/**
 * Check if string is a valid CUID (old ID format)
 */
export function isCuid(str: string): boolean {
    return /^c[a-z0-9]{24,25}$/i.test(str)
}
