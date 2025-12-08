
import { PrismaClient } from '@prisma/client'
import { generateStudentSlug, generateLessonSlug } from '../lib/slugUtils'

const prisma = new PrismaClient()

async function migrateStudents() {
    console.log('Migrating students...')
    const students = await prisma.student.findMany()

    for (const student of students) {
        const slug = generateStudentSlug(student.name, student.id)
        await prisma.student.update({
            where: { id: student.id },
            data: { slug }
        })
        console.log(`✓ Student: ${student.name} → ${slug}`)
    }

    console.log(`✓ Migrated ${students.length} students`)
}

async function migrateLessons() {
    console.log('Migrating lessons...')
    const lessons = await prisma.lesson.findMany({
        include: { student: true }
    })

    for (const lesson of lessons) {
        const slug = generateLessonSlug(
            lesson.student.name,
            new Date(lesson.date),
            lesson.topic || undefined
        )
        await prisma.lesson.update({
            where: { id: lesson.id },
            data: { slug }
        })
        console.log(`✓ Lesson: ${slug}`)
    }

    console.log(`✓ Migrated ${lessons.length} lessons`)
}

async function main() {
    try {
        await migrateStudents()
        await migrateLessons()
        console.log('✓ Migration completed successfully!')
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
