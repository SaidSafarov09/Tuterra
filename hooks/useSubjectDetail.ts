import { useState } from 'react'
import { toast } from 'sonner'
import { Subject, Student } from '@/types'

export function useSubjectDetail(subject: Subject | null, onUpdate?: () => void) {
    const [students, setStudents] = useState<Student[]>([])
    const [isLoadingStudents, setIsLoadingStudents] = useState(false)

    const fetchStudents = async (subjectId: string) => {
        setIsLoadingStudents(true)
        try {
            const response = await fetch(`/api/subjects/${subjectId}/students`)
            if (response.ok) {
                const data = await response.json()
                setStudents(data)
            } else {
                toast.error('Не удалось загрузить учеников')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке учеников')
        } finally {
            setIsLoadingStudents(false)
        }
    }

    const linkStudent = async (subjectId: string, studentId: string) => {
        try {
            const response = await fetch(`/api/subjects/${subjectId}/students/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId }),
            })

            if (response.ok) {
                await fetchStudents(subjectId)
                onUpdate?.()
                toast.success('Ученик успешно добавлен к предмету')
                return { success: true }
            } else {
                toast.error('Не удалось добавить ученика')
                return { success: false }
            }
        } catch (error) {
            toast.error('Произошла ошибка')
            return { success: false }
        }
    }

    const createAndLinkStudent = async (
        subjectId: string,
        studentData: { name: string; contact?: string; note?: string }
    ) => {
        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...studentData,
                    subjectId,
                }),
            })

            if (response.ok) {
                await fetchStudents(subjectId)
                onUpdate?.()
                toast.success('Ученик успешно создан и добавлен')
                return { success: true }
            } else {
                toast.error('Не удалось создать ученика')
                return { success: false }
            }
        } catch (error) {
            toast.error('Произошла ошибка')
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
            const response = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: lessonData.studentId,
                    subjectId,
                    date: lessonData.date.toISOString(),
                    price: parseInt(lessonData.price),
                    isPaid: lessonData.isPaid,
                }),
            })

            if (response.ok) {
                await fetchStudents(subjectId)
                onUpdate?.()
                toast.success('Занятие успешно создано')
                return { success: true }
            } else {
                toast.error('Не удалось создать занятие')
                return { success: false }
            }
        } catch (error) {
            toast.error('Произошла ошибка')
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
