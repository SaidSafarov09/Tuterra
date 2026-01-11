import { prisma } from './prisma'

export interface TelegramButton {
    text: string
    callback_data: string
}

// Helper to escape HTML tags for Telegram
function escapeHTML(text: string = ''): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

export async function sendTelegramNotification(
    userId: string,
    message: string,
    settingKey?: string,
    buttons?: TelegramButton[][]
) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { notificationSettings: true }
        })

        if (!user || !user.telegramChatId) {
            console.log(`[TG] Not sending to ${userId}: No telegramChatId`)
            return false
        }

        // 1. Ensure notificationSettings exist
        let settings = user.notificationSettings
        if (!settings) {
            settings = await prisma.notificationSettings.create({
                data: { userId, deliveryTelegram: true }
            })
        }

        // 2. Auto-enable deliveryTelegram if user has chatId but it's disabled
        if (!settings.deliveryTelegram) {
            await prisma.notificationSettings.update({
                where: { userId },
                data: { deliveryTelegram: true }
            })
            settings.deliveryTelegram = true
        }

        // 3. Global TG delivery check
        if (!settings.deliveryTelegram) {
            return false
        }

        // 4. Specific setting check (if key provided)
        if (settingKey && settings) {
            const s = settings as any
            if (s[settingKey] === false) {
                console.log(`[TG] Not sending to ${userId}: ${settingKey} disabled`)
                return false
            }
        }

        // 5. Quiet Hours Check
        if (settings.quietHoursEnabled) {
            const { quietHoursStart, quietHoursEnd } = settings
            if (quietHoursStart && quietHoursEnd) {
                const timezone = user.timezone || 'Europe/Moscow'
                const now = new Date()

                const userTimeStr = new Intl.DateTimeFormat('en-GB', {
                    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone
                }).format(now)

                const [currentH, currentM] = userTimeStr.split(':').map(Number)
                const [startH, startM] = quietHoursStart.split(':').map(Number)
                const [endH, endM] = quietHoursEnd.split(':').map(Number)

                const currentTotal = currentH * 60 + currentM
                const startTotal = startH * 60 + startM
                const endTotal = endH * 60 + endM

                let isQuiet = false
                if (startTotal <= endTotal) {
                    isQuiet = currentTotal >= startTotal && currentTotal < endTotal
                } else {
                    isQuiet = currentTotal >= startTotal || currentTotal < endTotal
                }

                if (isQuiet) {
                    console.log(`[TG] Quiet hours for user ${userId}`)
                    return true
                }
            }
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN
        if (!botToken) {
            console.error('[TG] Missing TELEGRAM_BOT_TOKEN')
            return false
        }

        const body: any = {
            chat_id: user.telegramChatId,
            text: message,
            parse_mode: 'HTML',
        }

        if (buttons && buttons.length > 0) {
            body.reply_markup = {
                inline_keyboard: buttons
            }
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('[TG] API error:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('[TG] Failed to send Telegram notification:', error)
        return false
    }
}

/**
 * Updates a telegram message (e.g., to remove buttons after click)
 */
export async function updateTelegramMessage(chatId: string, messageId: number, text: string, buttons?: TelegramButton[][]) {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN
        if (!botToken) return false

        const body: any = {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            parse_mode: 'HTML'
        }

        if (buttons) {
            body.reply_markup = { inline_keyboard: buttons }
        } else {
            body.reply_markup = { inline_keyboard: [] }
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('[TG] API error (edit):', error)
            return false
        }

        return true
    } catch (error) {
        console.error('[TG] Failed to update message:', error)
        return false
    }
}
