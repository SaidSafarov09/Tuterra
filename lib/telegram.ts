
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
