import { useState } from 'react'
import { toast } from 'sonner'
import { LessonFormData, Student } from '@/types'

export function useLessonForm(
    onSuccess: () => void,
    refetchStudents?: () => void,
    refetchSubjects?: () => void,
    refetchGroups?: () => void
) {
    const [formData, setFormData] = useState<LessonFormData>({
        studentId: '',
        groupId: '',
        subjectId: '',
        date: new Date(),
        price: '',
        isPaid: false,
        isTrial: false,
        notes: '',
        topic: '',
        duration: 60,
        paidStudentIds: [],
        planTopicId: undefined,
        link: '',
        rememberPrice: false,
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const resetForm = () => {
        setFormData({
            studentId: '',
            groupId: '',
            subjectId: '',
            date: new Date(),
            price: '',
            isPaid: false,
            isTrial: false,
            notes: '',
            topic: '',
            duration: 60,
            recurrence: undefined,
            isPaidAll: false,
            seriesPrice: undefined,
            paidStudentIds: [],
            planTopicId: undefined,
            link: '',
            rememberPrice: false,
        })
        setError('')
    }

    const loadLesson = (lesson: any) => {
        setFormData({
            studentId: lesson.student?.id || '',
            groupId: lesson.group?.id || '',
            subjectId: lesson.subject?.id || '',
            date: new Date(lesson.date),
            price: lesson.price.toString(),
            isPaid: lesson.isPaid,
            isTrial: lesson.isTrial || false,
            notes: lesson.notes || '',
            topic: lesson.topic || '',
            duration: lesson.duration || 60,
            paidStudentIds: lesson.lessonPayments?.filter((p: any) => p.hasPaid).map((p: any) => p.studentId) || [],
            planTopicId: lesson.planTopicId || undefined,
            link: lesson.link || '',
            rememberPrice: false,
        })
    }

    const handleChange = (name: string, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleStudentChange = (studentId: string, students: Student[]) => {
        const student = students.find((s) => s.id === studentId)
        const preSelectedSubject = student?.subjects.length === 1 ? student.subjects[0].id : ''
        setFormData((prev) => ({
            ...prev,
            studentId,
            groupId: undefined,
            subjectId: preSelectedSubject || prev.subjectId,
            price: (student?.defaultPrice !== null && student?.defaultPrice !== undefined) ? student.defaultPrice.toString() : prev.price,
            paidStudentIds: [],
            rememberPrice: false,
        }))
    }

    const handleGroupChange = (groupId: string, groups: any[]) => {
        const group = groups.find((g) => g.id === groupId)
        setFormData((prev) => ({
            ...prev,
            groupId,
            studentId: undefined,
            subjectId: group?.subjectId || prev.subjectId,
            price: (group?.defaultPrice !== null && group?.defaultPrice !== undefined) ? group.defaultPrice.toString() : prev.price,
            paidStudentIds: [],
            rememberPrice: false,
        }))
    }

    const handleCreateStudent = async (name: string) => {
        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })

            if (!response.ok) {
                toast.error('Не удалось создать ученика')
                return
            }

            const newStudent = await response.json()
            if (refetchStudents) await refetchStudents()
            setFormData((prev) => ({ ...prev, studentId: newStudent.id }))
            toast.success(`Ученик "${name}" создан`)
        } catch (error) {
            toast.error('Ошибка при создании ученика')
        }
    }

    const handleCreateSubject = async (name: string) => {
        try {
            const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]

            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: randomColor }),
            })

            if (!response.ok) {
                toast.error('Не удалось создать предмет')
                return
            }

            const newSubject = await response.json()
            if (refetchSubjects) await refetchSubjects()
            setFormData((prev) => ({ ...prev, subjectId: newSubject.id }))


            if (formData.studentId && refetchStudents) {
                try {
                    await fetch(`/api/subjects/${newSubject.id}/students/link`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId: formData.studentId }),
                    })
                    await refetchStudents()
                } catch (error) {
                    console.error('Failed to link subject to student:', error)
                }
            }

            toast.success(`Предмет "${name}" создан`)
        } catch (error) {
            toast.error('Ошибка при создании предмета')
        }
    }

    const handleSubmit = async (isEdit: boolean, lessonId?: string) => {
        if ((!formData.studentId && !formData.groupId) || !formData.price) {
            toast.error('Заполните все обязательные поля')
            return
        }

        if (formData.recurrence?.enabled && formData.recurrence.type === 'every_x_weeks') {
            const interval = formData.recurrence.interval
            if (interval === undefined || interval === null || interval === '' as any) {
                toast.error('Укажите интервал недель')
                return
            }
        }

        setIsSubmitting(true)
        setError('')

        try {
            const url = isEdit ? `/api/lessons/${lessonId}` : '/api/lessons'
            const method = isEdit ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: formData.studentId || undefined,
                    groupId: formData.groupId || undefined,
                    subjectId: formData.subjectId || undefined,
                    date: formData.date.toISOString(),
                    price: parseInt(formData.price),
                    isPaid: formData.isPaid,
                    isTrial: formData.isTrial || false,
                    notes: formData.notes,
                    topic: formData.topic,
                    duration: formData.duration,
                    recurrence: formData.recurrence,
                    isPaidAll: formData.isPaidAll,
                    seriesPrice: formData.seriesPrice ? parseInt(formData.seriesPrice) : undefined,
                    paidStudentIds: formData.paidStudentIds,
                    planTopicId: formData.planTopicId,
                    link: formData.link || undefined,
                    rememberPrice: formData.rememberPrice,
                }),
            })

            if (response.ok) {
                if (refetchStudents) await refetchStudents()
                if (refetchSubjects) await refetchSubjects()
                if (refetchGroups) await refetchGroups()
                onSuccess()
                toast.success(isEdit ? 'Занятие обновлено' : 'Занятие успешно добавлено')
            } else {
                const data = await response.json()
                const errorMessage = data.error || 'Произошла ошибка'
                toast.error(errorMessage)
            }
        } catch (error) {
            toast.error(isEdit ? 'Ошибка при обновлении занятия' : 'Произошла ошибка при создании занятия')
        } finally {
            setIsSubmitting(false)
        }
    }

    const loadLessonWithDate = (date: Date) => {
        setFormData(prev => ({
            ...prev,
            date: date,
        }))
    }

    return {
        formData,
        isSubmitting,
        error,
        setFormData,
        handleChange,
        handleStudentChange,
        handleCreateStudent,
        handleCreateSubject,
        loadLesson,
        loadLessonWithDate,
        resetForm,
        handleSubmit,
        handleGroupChange,
    }
}
