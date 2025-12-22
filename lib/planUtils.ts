import { prisma } from './prisma'

export async function updateTopicCompletionStatus(planTopicId: string | null) {
    if (!planTopicId) return

    const now = new Date()
    const pastLesson = await prisma.lesson.findFirst({
        where: {
            planTopicId,
            isCanceled: false,
            date: { lt: now }
        }
    })

    await prisma.learningPlanTopic.update({
        where: { id: planTopicId },
        data: { isCompleted: !!pastLesson }
    })
}
