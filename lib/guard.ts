import { prisma } from './prisma'
import { isPro } from './auth'
import { FREE_LIMITS } from './limits'

/**
 * Проверяет, заблокирован ли конкретный ученик для бесплатного пользователя
 */
export async function isStudentLocked(studentId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, proExpiresAt: true }
    })

    if (user && isPro(user)) return false

    // Получаем ID первых 3 созданных учеников
    const freeStudents = await prisma.student.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'asc' },
        take: FREE_LIMITS.students,
        select: { id: true }
    })

    const freeIds = freeStudents.map(s => s.id)
    return !freeIds.includes(studentId)
}

/**
 * Проверяет, заблокирована ли конкретная группа для бесплатного пользователя
 */
export async function isGroupLocked(groupId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, proExpiresAt: true }
    })

    if (user && isPro(user)) return false

    // Получаем ID первой созданной группы
    const freeGroups = await prisma.group.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'asc' },
        take: FREE_LIMITS.groups,
        select: { id: true }
    })

    const freeIds = freeGroups.map(g => g.id)
    return !freeIds.includes(groupId)
}

/**
 * Проверяет, заблокирован ли предмет
 */
export async function isSubjectLocked(subjectId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, proExpiresAt: true }
    })

    if (user && isPro(user)) return false

    const freeSubjects = await prisma.subject.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'asc' },
        take: FREE_LIMITS.subjects,
        select: { id: true }
    })

    const freeIds = freeSubjects.map(s => s.id)
    return !freeIds.includes(subjectId)
}

/**
 * Проверяет, заблокирован ли план обучения
 */
export async function isPlanLocked(planId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, proExpiresAt: true }
    })

    if (user && isPro(user)) return false

    const plan = await prisma.learningPlan.findUnique({
        where: { id: planId },
        select: { id: true, studentId: true, groupId: true, createdAt: true }
    })

    if (!plan) return false

    // Планы для групп всегда Pro (FREE_LIMITS.groupPlans = 0)
    if (plan.groupId) return true

    // Планы для студентов — разрешаем только один (первый созданный)
    if (plan.studentId) {
        // Сначала проверяем, не заблокирован ли сам студент
        const studentLocked = await isStudentLocked(plan.studentId, userId)
        if (studentLocked) return true

        // Затем проверяем, является ли этот план первым созданным планом пользователя
        const freePlans = await prisma.learningPlan.findMany({
            where: {
                ownerId: userId,
                groupId: null // Только студенческие планы
            },
            orderBy: { createdAt: 'asc' },
            take: FREE_LIMITS.studentPlans,
            select: { id: true }
        })

        const freePlanIds = freePlans.map(p => p.id)
        return !freePlanIds.includes(planId)
    }

    return false
}

/**
 * Проверяет, заблокирована ли СВЯЗЬ с учеником (онлайн-кабинет)
 */
export async function isConnectionLocked(studentId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, proExpiresAt: true }
    })

    if (user && isPro(user)) return false

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { linkedUserId: true }
    })

    if (!student || !student.linkedUserId) return false // Если связи нет, блокировать нечего

    // Получаем список всех подключенных учеников, отсортированных по дате создания
    // (так как у нас нет даты подключения, используем дату создания ученика как справедливую метрику "старейшинства")
    const connectedStudents = await prisma.student.findMany({
        where: {
            ownerId: userId,
            linkedUserId: { not: null }
        },
        orderBy: { createdAt: 'asc' },
        take: FREE_LIMITS.connectedStudents,
        select: { id: true }
    })

    const allowedIds = connectedStudents.map(s => s.id)
    return !allowedIds.includes(studentId)
}
