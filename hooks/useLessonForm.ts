import { useState } from 'react'
import { toast } from 'sonner'

interface LessonFormData {
    studentId: string
    subjectId: string
    date: Date
    price: string
    isPaid: boolean
    notes?: string
}

interface Student {
    id: string
    name: string
    subjects: { id: string; name: string; color: string }[]
}

export function useLessonForm(
    onSuccess: () => void,
    refetchStudents?: () => void,
    refetchSubjects?: () => void
) {
    const [formData, setFormData] = useState<LessonFormData>({
        studentId: '',
        subjectId: '',
        date: new Date(),
        price: '',
        isPaid: false,
        notes: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const resetForm = () => {
        setFormData({
            studentId: '',
            subjectId: '',
            date: new Date(),
            price: '',
            isPaid: false,
            notes: '',
        })
        setError('')
    }

    const loadLesson = (lesson: any) => {
        setFormData({
            studentId: lesson.student.id,
            subjectId: lesson.subject?.id || '',
            date: new Date(lesson.date),
            price: lesson.price.toString(),
            isPaid: lesson.isPaid,
            notes: lesson.notes || '',
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
            subjectId: preSelectedSubject || prev.subjectId,
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

            // Auto-link subject to student if student is selected
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
        if (!formData.studentId || !formData.price) {
            toast.error('Заполните все обязательные поля')
            return
        }

        if (!isEdit && formData.date < new Date()) {
            toast.error('Нельзя создавать занятия в прошедшем времени')
            return
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
                    studentId: formData.studentId,
                    subjectId: formData.subjectId || undefined,
                    date: formData.date.toISOString(),
                    price: parseInt(formData.price),
                    isPaid: formData.isPaid,
                    notes: formData.notes,
                }),
            })

            if (response.ok) {
                onSuccess()
                toast.success(isEdit ? 'Занятие обновлено' : 'Занятие успешно добавлено')
            } else {
                const data = await response.json()
                setError(data.error || 'Произошла ошибка')
            }
        } catch (error) {
            toast.error('Произошла ошибка при создании занятия')
            setError('Произошла ошибка при создании занятия')
        } finally {
            setIsSubmitting(false)
        }
    }

    return {
        formData,
        isSubmitting,
        error,
        setFormData,
        setError,
        resetForm,
        loadLesson,
        handleChange,
        handleStudentChange,
        handleCreateStudent,
        handleCreateSubject,
        handleSubmit,
    }
}
