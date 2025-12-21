
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

        // If a specific setting is requested, check it
        if (settingKey && user.notificationSettings) {
            const settings = user.notificationSettings as any
            if (settings[settingKey] === false) {
                console.log(`DEBUG: sendTelegramNotification skipped - ${String(settingKey)} is disabled for user ${userId}`)
                return false
            }
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN
        if (!botToken) {
            console.error('DEBUG: TELEGRAM_BOT_TOKEN not found in environment')
            return false
        }

        console.log(`DEBUG: Sending Telegram message to ${user.telegramChatId}: ${message.substring(0, 20)}...`)
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

        console.log('DEBUG: Telegram message sent successfully')
        return true
    } catch (error) {
        console.error('Failed to send Telegram notification:', error)
        return false
    }
}
