
import { prisma } from './prisma'

export async function sendTelegramNotification(userId: string, message: string, settingKey?: keyof any) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { notificationSettings: true }
        })

        if (!user) {
            console.error(`DEBUG: sendTelegramNotification failed - User ${userId} not found`)
            return false
        }
        if (!user.telegramChatId) {
            console.error(`DEBUG: sendTelegramNotification failed - User ${userId} has no telegramChatId`)
            return false
        }
        if (!user.notificationSettings?.deliveryTelegram) {
            console.error(`DEBUG: sendTelegramNotification failed - User ${userId} has deliveryTelegram disabled`)
            return false
        }

        if (settingKey && user.notificationSettings) {
            const settings = user.notificationSettings as any
            if (settings[settingKey] === false) {
                return false
            }
        }

        // Quiet Hours Check
        if (user.notificationSettings?.quietHoursEnabled) {
            const { quietHoursStart, quietHoursEnd } = user.notificationSettings
            if (quietHoursStart && quietHoursEnd) {
                const timezone = user.timezone || 'Europe/Moscow'
                const now = new Date()

                // Get current time in user's timezone
                const userTimeStr = new Intl.DateTimeFormat('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: timezone
                }).format(now)

                const [currentH, currentM] = userTimeStr.split(':').map(Number)
                const [startH, startM] = quietHoursStart.split(':').map(Number)
                const [endH, endM] = quietHoursEnd.split(':').map(Number)

                const currentTotal = currentH * 60 + currentM
                const startTotal = startH * 60 + startM
                const endTotal = endH * 60 + endM

                let isQuiet = false
                if (startTotal <= endTotal) {
                    // Same day (e.g., 14:00 - 16:00)
                    isQuiet = currentTotal >= startTotal && currentTotal < endTotal
                } else {
                    // Overnight (e.g., 22:00 - 08:00)
                    isQuiet = currentTotal >= startTotal || currentTotal < endTotal
                }

                if (isQuiet) {
                    console.log(`DEBUG: Notification for user ${userId} skipped due to Quiet Hours (${quietHoursStart} - ${quietHoursEnd} in ${timezone})`)
                    return true // Return true because we handled it (by skipping)
                }
            }
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN
        if (!botToken) {
            console.error('DEBUG: TELEGRAM_BOT_TOKEN not found in environment')
            return false
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: user.telegramChatId,
                text: message,
                parse_mode: 'Markdown'
            })
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('DEBUG: Telegram API error:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Failed to send Telegram notification:', error)
        return false
    }
}
