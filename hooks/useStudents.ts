import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { useModalStore } from '@/store/useModalStore'
import { Student, Subject } from '@/types'

export function useStudents() {
    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        note: '',
        subjectId: '',
        subjectName: '',
    })

    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all')

    const { isOpen, openModal, closeModal } = useModalStore()

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/students')
            if (response.ok) {
                setStudents(await response.json())
            } else {
                toast.error('Не удалось загрузить учеников')
            }
        } catch (e) {
            toast.error('Произошла ошибка при загрузке учеников')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                setSubjects(await response.json())
            } else {
                toast.error('Не удалось загрузить предметы')
            }
        } catch (e) {
            toast.error('Произошла ошибка при загрузке предметов')
        }
    }

    useEffect(() => {
        fetchStudents()
        fetchSubjects()
    }, [])

    const handleOpenModal = () => {
        setFormData({
            name: '',
            contact: '',
            note: '',
            subjectId: '',
            subjectName: '',
        })
        setError('')
        openModal('create')
    }

    const handleCloseModal = () => {
        closeModal()
        setError('')
    }

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target
            setFormData((prev) => ({ ...prev, [name]: value }))
        },
        []
    )

    const handleCreateSubject = async (name: string) => {
        try {
            const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]

            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: randomColor }),
            })

            if (response.ok) {
                const newSubject = await response.json()
                await fetchSubjects()
                setFormData(prev => ({
                    ...prev,
                    subjectId: newSubject.id,
                    subjectName: newSubject.name
                }))
                toast.success(`Предмет "${name}" создан`)
            } else {
                toast.error('Не удалось создать предмет')
            }
        } catch (error) {
            toast.error('Ошибка при создании предмета')
        }
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Введите имя ученика')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                await fetchStudents()
                await fetchSubjects()
                handleCloseModal()
                toast.success('Ученик успешно добавлен')
            } else {
                const data = await response.json()
                setError(data.error || 'Произошла ошибка')
            }
        } catch (error) {
            toast.error('Произошла ошибка при создании ученика')
            setError('Произошла ошибка при создании ученика')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredStudents = useMemo(() => {
        if (selectedSubjectFilter === 'all') return students
        return students.filter((s) => s.subjects.some(subj => subj.id === selectedSubjectFilter))
    }, [students, selectedSubjectFilter])

    return {
        students,
        subjects,
        isLoading,
        isSubmitting,
        error,
        formData,
        setFormData,
        selectedSubjectFilter,
        setSelectedSubjectFilter,
        isOpen,
        handleOpenModal,
        handleCloseModal,
        handleChange,
        handleCreateSubject,
        handleSubmit,
        filteredStudents
    }
}
