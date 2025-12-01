import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Student, Subject } from '@/types'

export function useStudentDetail(studentId: string) {
    const router = useRouter()
    const [student, setStudent] = useState<Student | null>(null)
    const [allSubjects, setAllSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false)
    const [isCreateLessonModalOpen, setIsCreateLessonModalOpen] = useState(false)
    const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false)
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null)

    const [editFormData, setEditFormData] = useState({
        name: '',
        contact: '',
        note: '',
    })
    const [selectedSubjectId, setSelectedSubjectId] = useState('')
    const [lessonFormData, setLessonFormData] = useState({
        subjectId: '',
        date: new Date(),
        price: '',
        isPaid: false,
        topic: '',
        notes: '',
    })

    const [deleteStudentConfirm, setDeleteStudentConfirm] = useState(false)
    const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState<string | null>(null)
    const [deleteLessonConfirm, setDeleteLessonConfirm] = useState<string | null>(null)

    const fetchStudent = async () => {
        try {
            const response = await fetch(`/api/students/${studentId}`)
            if (response.ok) {
                const data = await response.json()
                setStudent(data)
            } else {
                toast.error('Ученик не найден')
                router.push('/students')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке ученика')
            router.push('/students')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                setAllSubjects(await response.json())
            }
        } catch (error) {
            console.error('Failed to fetch subjects:', error)
        }
    }

    useEffect(() => {
        if (studentId) {
            fetchStudent()
            fetchSubjects()
        }
    }, [studentId])

    const handleDeleteStudent = async () => {
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('Ученик успешно удален')
                router.push('/students')
            } else {
                toast.error('Произошла ошибка при удалении')
            }
        } catch (error) {
            toast.error('Произошла ошибка при удалении')
        } finally {
            setDeleteStudentConfirm(false)
        }
    }

    const handleDeleteSubject = async () => {
        if (!deleteSubjectConfirm) return

        try {
            const response = await fetch(`/api/subjects/${deleteSubjectConfirm}/students/link`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId }),
            })

            if (response.ok) {
                await fetchStudent()
                await fetchSubjects()
                toast.success('Предмет удалён')
            } else {
                toast.error('Не удалось удалить предмет')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setDeleteSubjectConfirm(null)
        }
    }

    const handleUpdateStudent = async () => {
        if (!editFormData.name.trim()) {
            toast.error('Введите имя ученика')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData),
            })

            if (response.ok) {
                await fetchStudent()
                setIsEditModalOpen(false)
                toast.success('Данные обновлены')
            } else {
                toast.error('Не удалось обновить данные')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddSubject = async () => {
        if (!selectedSubjectId) {
            toast.error('Выберите предмет')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/subjects/${selectedSubjectId}/students/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId }),
            })

            if (response.ok) {
                await fetchStudent()
                await fetchSubjects()
                setIsAddSubjectModalOpen(false)
                toast.success('Предмет добавлен')
            } else {
                toast.error('Не удалось добавить предмет')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCreateLesson = async () => {
        if (!lessonFormData.price) {
            toast.error('Укажите цену')
            return
        }

        if (lessonFormData.date < new Date()) {
            toast.error('Нельзя создавать занятия в прошедшем времени')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    subjectId: lessonFormData.subjectId || undefined,
                    date: lessonFormData.date.toISOString(),
                    price: Number(lessonFormData.price),
                    isPaid: lessonFormData.isPaid,
                    topic: lessonFormData.topic,
                    notes: lessonFormData.notes,
                }),
            })

            if (response.ok) {
                await fetchStudent()
                setIsCreateLessonModalOpen(false)
                toast.success('Занятие создано')
            } else {
                toast.error('Не удалось создать занятие')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCreateSubject = async (name: string, forLink: boolean = false) => {
        try {
            const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]

            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: randomColor }),
            })

            if (!response.ok) {
                const data = await response.json()
                toast.error(data.error || 'Не удалось создать предмет')
                return
            }

            const newSubject = await response.json()

            if (!forLink) {
                // Link to student if creating from lesson modal
                await fetch(`/api/subjects/${newSubject.id}/students/link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId }),
                })
                setLessonFormData(prev => ({ ...prev, subjectId: newSubject.id }))
            } else {
                setSelectedSubjectId(newSubject.id)
                toast.success(`Предмет "${name}" создан. Нажмите "Добавить", чтобы привязать его.`)
            }

            await fetchSubjects()
            if (!forLink) toast.success(`Предмет "${name}" создан`)
        } catch (error) {
            toast.error('Ошибка при создании предмета')
        }
    }

    const handleEditLesson = async (lesson: any) => {
        setLessonFormData({
            subjectId: lesson.subject?.id || '',
            date: new Date(lesson.date),
            price: lesson.price.toString(),
            isPaid: lesson.isPaid,
            topic: lesson.topic || '',
            notes: lesson.notes || '',
        })
        setEditingLessonId(lesson.id)
        setIsEditLessonModalOpen(true)
    }

    const handleUpdateLesson = async () => {
        if (!editingLessonId) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/lessons/${editingLessonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    subjectId: lessonFormData.subjectId || undefined,
                    date: lessonFormData.date.toISOString(),
                    price: Number(lessonFormData.price),
                    isPaid: lessonFormData.isPaid,
                    topic: lessonFormData.topic,
                    notes: lessonFormData.notes,
                }),
            })

            if (response.ok) {
                await fetchStudent()
                setIsEditLessonModalOpen(false)
                setEditingLessonId(null)
                toast.success('Занятие обновлено')
            } else {
                toast.error('Не удалось обновить занятие')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteLesson = async (lessonId: string) => {
        setDeleteLessonConfirm(lessonId)
    }

    const confirmDeleteLesson = async () => {
        if (!deleteLessonConfirm) return

        try {
            const response = await fetch(`/api/lessons/${deleteLessonConfirm}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                await fetchStudent()
                toast.success('Занятие удалено')
            } else {
                toast.error('Не удалось удалить занятие')
            }
        } catch (error) {
            toast.error('Произошла ошибка при удалении')
        } finally {
            setDeleteLessonConfirm(null)
        }
    }

    const handleTogglePaidStatus = async (lessonId: string, isPaid: boolean) => {
        try {
            const response = await fetch(`/api/lessons/${lessonId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPaid }),
            })

            if (response.ok) {
                await fetchStudent()
                toast.success(isPaid ? 'Занятие отмечено как оплаченное' : 'Оплата отменена')
            } else {
                toast.error('Не удалось обновить статус оплаты')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        }
    }

    const handleToggleCancelLesson = async (lessonId: string, isCanceled: boolean) => {
        try {
            const response = await fetch(`/api/lessons/${lessonId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCanceled }),
            })

            if (response.ok) {
                await fetchStudent()
                toast.success(isCanceled ? 'Занятие отменено' : 'Занятие восстановлено')
            } else {
                toast.error('Не удалось обновить статус занятия')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        }
    }

    const openEditModal = () => {
        if (!student) return
        setEditFormData({
            name: student.name,
            contact: student.contact || '',
            note: student.note || '',
        })
        setIsEditModalOpen(true)
    }

    const openCreateLessonModal = () => {
        const defaultSubjectId = student?.subjects.length === 1 ? student.subjects[0].id : ''
        setLessonFormData({
            subjectId: defaultSubjectId,
            date: new Date(),
            price: '',
            isPaid: false,
            topic: '',
            notes: '',
        })
        setIsCreateLessonModalOpen(true)
    }

    return {
        student,
        allSubjects,
        isLoading,
        isSubmitting,

        // Modal States
        isEditModalOpen, setIsEditModalOpen,
        isAddSubjectModalOpen, setIsAddSubjectModalOpen,
        isCreateLessonModalOpen, setIsCreateLessonModalOpen,
        isEditLessonModalOpen, setIsEditLessonModalOpen,

        // Form Data
        editFormData, setEditFormData,
        selectedSubjectId, setSelectedSubjectId,
        lessonFormData, setLessonFormData,

        // Confirm States
        deleteStudentConfirm, setDeleteStudentConfirm,
        deleteSubjectConfirm, setDeleteSubjectConfirm,
        deleteLessonConfirm, setDeleteLessonConfirm,

        // Actions
        handleDeleteStudent,
        handleDeleteSubject,
        handleUpdateStudent,
        handleAddSubject,
        handleCreateLesson,
        handleUpdateLesson,
        confirmDeleteLesson,
        handleCreateSubject,
        handleEditLesson,
        handleDeleteLesson,
        handleTogglePaidStatus,
        handleToggleCancelLesson,

        // Openers
        openEditModal,
        openCreateLessonModal
    }
}
