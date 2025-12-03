/**
 * SMS sending utilities
 * Currently uses fake implementation for development
 */

export async function sendSMS(phone: string, code: string): Promise<boolean> {
    // TODO: Integrate with real SMS provider (e.g., Twilio, SMS.ru, etc.)
    console.log(`[SMS] Sending code ${code} to ${phone}`)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return true
}

export function validatePhoneNumber(phone: string): boolean {
    // Validate Russian phone number format: +7XXXXXXXXXX
    const phoneRegex = /^\+7\d{10}$/
    return phoneRegex.test(phone)
}

export function generateVerificationCode(length: number = 6): string {
    const min = Math.pow(10, length - 1)
    const max = Math.pow(10, length) - 1
    return Math.floor(Math.random() * (max - min + 1) + min).toString()
}
