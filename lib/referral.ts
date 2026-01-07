import { prisma } from './prisma'
import { addDays } from 'date-fns'
import { sendReferralBonusEmail } from './mail'

export const REFERRAL_LIMITS = {
    MAX_BONUS_MONTHS: 3,     // Максимум 3 бонусных месяца на аккаунт
    THRESHOLD_LESSONS: 5,   // Нужно создать 5 уроков
    THRESHOLD_STUDENTS: 3,  // Нужно добавить 3 учеников
    BONUS_DAYS: 30          // Бонус — 30 дней
}

/**
 * Процесс привязки реферала при регистрации.
 * Приглашенный (invitee) СРАЗУ получает 30 дней PRO.
 */
export async function processTeacherReferral(inviteeId: string, refCode: string) {
    const invitee = await prisma.user.findUnique({
        where: { id: inviteeId },
        select: { id: true, invitedById: true, role: true }
    })

    // Если уже привязан к кому-то ИЛИ это ученик, ничего не делаем
    // Реферальная система "Пригласи друга" работает только для преподавателей
    if (!invitee || invitee.invitedById || invitee.role === 'student') return

    const inviter = await prisma.user.findUnique({
        where: { referralCode: refCode.trim().toUpperCase() }
    })

    if (!inviter || inviter.id === inviteeId) return

    // Привязываем приглашенного к пригласившему
    await prisma.user.update({
        where: { id: inviteeId },
        data: {
            invitedById: inviter.id
        }
    })

    // Сразу даем бонус приглашенному другу, чтобы он мог оценить сервис
    await grantProBonus(inviteeId)

    console.log(`Referral: linked ${inviteeId} to ${inviter.id}. Invitee granted immediate PRO.`)
}

/**
 * Проверка выполнения условий (Proof of Work).
 * Если условия выполнены, пригласивший (inviter) получает свой бонус.
 */
export async function checkAndGrantInviterBonus(userId: string) {
    const invitee = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            invitedBy: true,
            _count: {
                select: {
                    lessons: true,
                    students: true
                }
            }
        }
    })

    if (!invitee || !invitee.invitedById || invitee.referralBonusClaimed) return

    const inviter = invitee.invitedBy
    if (!inviter) return

    // Проверяем достижение порога активности
    const hasEnoughLessons = invitee._count.lessons >= REFERRAL_LIMITS.THRESHOLD_LESSONS
    const hasEnoughStudents = invitee._count.students >= REFERRAL_LIMITS.THRESHOLD_STUDENTS

    if (hasEnoughLessons && hasEnoughStudents) {
        const inviteeName = invitee.firstName
            ? `${invitee.firstName}${invitee.lastName ? ' ' + invitee.lastName : ''}`
            : 'Ваш друг'

        // Проверяем лимит бонусов у пригласившего
        if (inviter.bonusMonthsEarned < REFERRAL_LIMITS.MAX_BONUS_MONTHS) {
            // Начисляем бонус пригласившему
            await grantProBonus(inviter.id)

            // Обновляем счетчик заработанных месяцев
            await prisma.user.update({
                where: { id: inviter.id },
                data: {
                    bonusMonthsEarned: { increment: 1 }
                }
            })

            // Помечаем, что этот реферал уже "отработал" бонус для пригласившего
            await prisma.user.update({
                where: { id: userId },
                data: {
                    referralBonusClaimed: true
                }
            })

            // Создаем уведомление для пригласившего
            await prisma.notification.create({
                data: {
                    userId: inviter.id,
                    type: 'referral_bonus_earned',
                    title: '🎉 Вы получили +30 дней PRO!',
                    message: `${inviteeName} активно использует Tuterra! Вы получили 30 дней PRO в подарок.`,
                    link: '/settings?tab=referral',
                    data: JSON.stringify({
                        inviteeId: userId,
                        inviteeName,
                        bonusDays: 30,
                        earnedAt: new Date().toISOString()
                    })
                }
            })

            // Отправляем email-уведомление, если у пользователя есть email
            if (inviter.email) {
                try {
                    await sendReferralBonusEmail(inviter.email, inviter.firstName || 'Коллега', inviteeName)
                } catch (emailError) {
                    console.error('Failed to send referral bonus email:', emailError)
                }
            }

            console.log(`Referral: Threshold reached for ${userId}. Inviter ${inviter.id} granted 30 days PRO.`)
        } else {
            // Если лимит достигнут, все равно отправляем уведомление, но без бонуса
            await prisma.notification.create({
                data: {
                    userId: inviter.id,
                    type: 'referral_limit_reached',
                    title: '🙌 Ваш друг с нами!',
                    message: `${inviteeName} активно использует Tuterra! Лимит бонусных месяцев (30 дней × 3) уже достигнут, но спасибо, что развиваете сообщество!`,
                    link: '/settings?tab=referral',
                    data: JSON.stringify({
                        inviteeId: userId,
                        inviteeName,
                        earnedAt: new Date().toISOString()
                    })
                }
            })

            console.log(`Referral: Threshold reached for ${userId}, but inviter ${inviter.id} has reached MAX bonus limit.`)
            // Помечаем чтобы больше не проверять
            await prisma.user.update({
                where: { id: userId },
                data: { referralBonusClaimed: true }
            })
        }
    }
}

/**
 * Вспомогательная функция для продления PRO
 */
async function grantProBonus(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, proExpiresAt: true, proActivatedAt: true }
    })
    if (!user) return

    const now = new Date()
    let newExpiry: Date

    // Если PRO уже есть и он активен, прибавляем к дате окончания
    if (user.proExpiresAt && user.proExpiresAt > now) {
        newExpiry = addDays(user.proExpiresAt, REFERRAL_LIMITS.BONUS_DAYS)
    } else {
        // Если нет — даем от текущего момента
        newExpiry = addDays(now, REFERRAL_LIMITS.BONUS_DAYS)
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            isPro: true,
            proExpiresAt: newExpiry,
            proActivatedAt: user.proActivatedAt || now,
            plan: 'pro'
        }
    })
}
