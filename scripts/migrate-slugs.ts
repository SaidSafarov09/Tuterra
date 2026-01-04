
import { PrismaClient } from '@prisma/client'
import { generateStudentSlug, generateLessonSlug } from '../lib/slugUtils'

const prisma = new PrismaClient()

async function migrateStudents() {
    const students = await prisma.student.findMany()

    for (const student of students) {
        const slug = generateStudentSlug(student.name, student.id)
        await prisma.student.update({
            where: { id: student.id },
            data: { slug }
        })
    }
}

async function migrateLessons() {
    const lessons = await prisma.lesson.findMany({
        include: { student: true }
    })

    for (const lesson of lessons) {
        // Проверяем, что у урока есть студент перед генерацией слага
        if (lesson.student) {
            const slug = generateLessonSlug(
                lesson.student.name,
                new Date(lesson.date),
                lesson.topic || undefined
            )
            await prisma.lesson.update({
                where: { id: lesson.id },
                data: { slug }
            })
        }
    }

}

async function main() {
    try {
        await migrateStudents()
        await migrateLessons()
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
