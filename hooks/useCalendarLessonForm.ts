import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Student, Subject, LessonFormData } from '@/types'

interface UseCalendarLessonFormOptions {
    onSuccess?: () => void
    initialDate?: Date
}

/**
 * Hook for managing lesson form in calendar context
 * Handles form state, student/subject creation, and submission
 */
export function useCalendarLessonForm(options: UseCalendarLessonFormOptions = {}) {
    const { onSuccess, initialDate } = options

    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState<LessonFormData>({
        studentId: '',
        subjectId: '',
        date: initialDate || new Date(),
        price: '',
        isPaid: false,
        notes: '',
        topic: '',
        duration: 60,
        recurrence: undefined,
        isPaidAll: false,
        seriesPrice: undefined,
        planTopicId: undefined,
    })

    useEffect(() => {
        fetchStudents()
        fetchSubjects()
    }, [])

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/students')
            if (response.ok) {
                const data = await response.json()
                setStudents(data)
            }
        } catch (error) {
            console.error('Failed to fetch students', error)
        }
    }

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                const data = await response.json()
                setSubjects(data)
            }
        } catch (error) {
            console.error('Failed to fetch subjects', error)
        }
    }

    const handleStudentChange = (studentId: string) => {
        const student = students.find(s => s.id === studentId)
        const preSelectedSubject = student?.subjects.length === 1 ? student.subjects[0].id : ''
        setFormData(prev => ({
            ...prev,
            studentId,
            subjectId: preSelectedSubject || prev.subjectId
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
            await fetchStudents()
            setFormData(prev => ({ ...prev, studentId: newStudent.id }))
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
            await fetchSubjects()
            setFormData(prev => ({ ...prev, subjectId: newSubject.id }))

            if (formData.studentId) {
                try {
                    await fetch(`/api/subjects/${newSubject.id}/students/link`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId: formData.studentId }),
                    })
                    await fetchStudents()
                } catch (error) {
                    console.error('Failed to link subject to student:', error)
                }
            }

            toast.success(`Предмет "${name}" создан`)
        } catch (error) {
            toast.error('Ошибка при создании предмета')
        }
    }

    const handleSubmit = async () => {
        if (!formData.studentId || !formData.price) {
            toast.error('Заполните все обязательные поля')
            return false
        }

        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: formData.studentId,
                    subjectId: formData.subjectId || undefined,
                    date: formData.date.toISOString(),
                    price: parseInt(formData.price),
                    isPaid: formData.isPaid,
                    notes: formData.notes,
                    topic: formData.topic,
                    recurrence: formData.recurrence,
                    isPaidAll: formData.isPaidAll,
                    seriesPrice: formData.seriesPrice ? parseInt(formData.seriesPrice) : undefined,
                    planTopicId: formData.planTopicId,
                }),
            })

            if (response.ok) {
                toast.success('Занятие успешно добавлено')
                onSuccess?.()
                return true
            } else {
                const data = await response.json()
                setError(data.error || 'Произошла ошибка')
                return false
            }
        } catch (error) {
            toast.error('Произошла ошибка при создании занятия')
            setError('Произошла ошибка при создании занятия')
            return false
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = (date?: Date) => {
        setFormData({
            studentId: '',
            subjectId: '',
            date: date || new Date(),
            price: '',
            isPaid: false,
            notes: '',
            topic: '',
            duration: 60,
            recurrence: undefined,
            isPaidAll: false,
            seriesPrice: undefined,
            planTopicId: undefined,
        })
        setError('')
    }

    return {
        students,
        subjects,
        formData,
        setFormData,
        isSubmitting,
        error,
        setError,
        handleStudentChange,
        handleCreateStudent,
        handleCreateSubject,
        handleSubmit,
        resetForm,
    }
}
