import { useState } from 'react'
import { toast } from 'sonner'
import { Subject, Student } from '@/types'
import { subjectsApi, studentsApi, lessonsApi } from '@/services/api'
import { STUDENT_MESSAGES, LESSON_MESSAGES, createStudentLinkedMessage } from '@/constants/messages'

export function useSubjectDetail(subject: Subject | null, onUpdate?: () => void) {
    const [students, setStudents] = useState<Student[]>([])
    const [isLoadingStudents, setIsLoadingStudents] = useState(false)

    const fetchStudents = async (subjectId: string) => {
        setIsLoadingStudents(true)
        try {
            const data = await subjectsApi.getStudents(subjectId)
            setStudents(data)
        } catch (error) {
            toast.error(STUDENT_MESSAGES.FETCH_ERROR)
        } finally {
            setIsLoadingStudents(false)
        }
    }

    const linkStudent = async (subjectId: string, studentId: string) => {
        try {
            await subjectsApi.linkStudent(subjectId, studentId)
            await fetchStudents(subjectId)
            onUpdate?.()
            toast.success(STUDENT_MESSAGES.LINKED_TO_SUBJECT)
            return { success: true }
        } catch (error) {
            toast.error('Не удалось добавить ученика')
            return { success: false }
        }
    }

    const createAndLinkStudent = async (
        subjectId: string,
        studentData: { name: string; contact?: string; note?: string }
    ) => {
        try {
            const newStudent = await studentsApi.create({
                ...studentData,
                subjectId,
            })

            await fetchStudents(subjectId)
            onUpdate?.()
            toast.success(createStudentLinkedMessage(newStudent.name))
            return { success: true }
        } catch (error) {
            toast.error(STUDENT_MESSAGES.CREATE_ERROR)
            return { success: false }
        }
    }

    const createLesson = async (
        subjectId: string,
        lessonData: {
            studentId: string
            date: Date
            price: string
            isPaid: boolean
        }
    ) => {
        try {
            await lessonsApi.create({
                studentId: lessonData.studentId,
                subjectId,
                date: lessonData.date.toISOString(),
                price: parseInt(lessonData.price),
                isPaid: lessonData.isPaid,
            })

            await fetchStudents(subjectId)
            onUpdate?.()
            toast.success(LESSON_MESSAGES.CREATED)
            return { success: true }
        } catch (error) {
            toast.error(LESSON_MESSAGES.CREATE_ERROR)
            return { success: false }
        }
    }

    return {
        students,
        isLoadingStudents,
        fetchStudents,
        linkStudent,
        createAndLinkStudent,
        createLesson,
    }
}
