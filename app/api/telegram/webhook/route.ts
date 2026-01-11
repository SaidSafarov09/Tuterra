import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateTelegramMessage } from '@/lib/telegram'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // 1. Handle Callback Queries (Buttons)
        if (body.callback_query) {
            return await handleCallbackQuery(body.callback_query)
        }

        // 2. Handle Messages (Commands)
        if (body.message) {
            return await handleMessage(body.message)
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Telegram webhook error:', error)
        return NextResponse.json({ ok: true }) // Always return 200 to TG
    }
}

async function handleMessage(message: any) {
    const chatId = message.chat.id.toString()
    const text = message.text || ''

    const user = await prisma.user.findFirst({
        where: { telegramChatId: chatId }
    })

    if (text.startsWith('/start')) {
        if (!user) {
            const msg = `Привет! 👋\n\nЯ — бот платформы **Tuterra**. Чтобы я мог присылать тебе уведомления и отчеты, тебе нужно привязать свой аккаунт на сайте в разделе "Настройки".`
            await sendMessage(chatId, msg)
        } else {
            const roleLabel = user.role === 'teacher' ? 'преподаватель' : 'ученик'
            const msg = `С возвращением, ${user.firstName || user.name || 'пользователь'}! 👋\n\nТы авторизован как **${roleLabel}**. Я буду присылать тебе важные уведомления о занятиях и оплатах.`
            await sendMessage(chatId, msg)
        }
    } else if (text === '/me') {
        if (!user) {
            await sendMessage(chatId, 'Аккаунт не привязан. Сделайте это в настройках профиля на сайте.')
        } else {
            const roleLabel = user.role === 'teacher' ? 'Преподаватель' : 'Ученик'
            const msg = `👤 **Профиль Tuterra**\n\nИмя: ${user.firstName || user.name}\nРоль: ${roleLabel}\nEmail: ${user.email}\nЧасовой пояс: ${user.timezone || 'Не указан'}`
            await sendMessage(chatId, msg)
        }
    }

    return NextResponse.json({ ok: true })
}

async function handleCallbackQuery(callbackQuery: any) {
    const chatId = callbackQuery.message.chat.id.toString()
    const messageId = callbackQuery.message.message_id
    const data = callbackQuery.data // e.g. "lr_approve:requestId"

    const user = await prisma.user.findFirst({
        where: { telegramChatId: chatId }
    })

    if (!user || user.role !== 'teacher') {
        return NextResponse.json({ ok: true })
    }

    if (data.startsWith('lr_approve:') || data.startsWith('lr_reject:')) {
        const [action, requestId] = data.split(':')
        const isApprove = action === 'lr_approve'

        try {
            const lr = await (prisma as any).lessonRequest.findUnique({
                where: { id: requestId },
                include: { lesson: true }
            })

            if (!lr || lr.lesson.ownerId !== user.id) {
                await answerCallbackQuery(callbackQuery.id, 'Заявка не найдена или доступ запрещен')
                return NextResponse.json({ ok: true })
            }

            if (lr.status !== 'pending') {
                await updateTelegramMessage(chatId, messageId, `⚠️ Эта заявка уже была обработана ранее (Статус: ${lr.status})`)
                return NextResponse.json({ ok: true })
            }

            // Process Logic
            if (isApprove) {
                if (lr.type === 'reschedule' && lr.newDate) {
                    await prisma.lesson.update({
                        where: { id: lr.lessonId },
                        data: { date: lr.newDate, status: 'confirmed' }
                    })
                } else if (lr.type === 'cancel') {
                    await prisma.lesson.update({
                        where: { id: lr.lessonId },
                        data: { isCanceled: true, status: 'confirmed' }
                    })
                }

                await (prisma as any).lessonRequest.update({
                    where: { id: requestId },
                    data: { status: 'approved' }
                })

                await updateTelegramMessage(chatId, messageId, `✅ **Заявка одобрена**\n\nВсе изменения внесены в расписание. Ученик получит уведомление.`)
            } else {
                await (prisma as any).lessonRequest.update({
                    where: { id: requestId },
                    data: { status: 'rejected' }
                })

                await prisma.lesson.update({
                    where: { id: lr.lessonId },
                    data: { status: 'confirmed' }
                })

                await updateTelegramMessage(chatId, messageId, `❌ **Заявка отклонена**\n\nСтатус заявки обновлен. Ученик получит уведомление.`)
            }

            // Notify student
            const { notifyLessonRequestResult } = await import('@/lib/lesson-actions-server')
            await notifyLessonRequestResult(requestId)

            await answerCallbackQuery(callbackQuery.id, isApprove ? 'Заявка одобрена' : 'Заявка отклонена')

        } catch (e) {
            console.error('Error processing TG callback:', e)
            await answerCallbackQuery(callbackQuery.id, 'Произошла ошибка при обработке')
        }
    }

    return NextResponse.json({ ok: true })
}

async function sendMessage(chatId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    })
}

async function answerCallbackQuery(callbackQueryId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text })
    })
}
