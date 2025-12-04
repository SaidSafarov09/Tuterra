import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Student, Subject } from '@/types'
import { studentsApi, subjectsApi } from '@/services/api'
import {
    deleteStudent,
    updateStudent,
    fetchStudents,
    fetchSubjects,
    createLesson,
    updateLesson,
    deleteLesson,
    toggleLessonPaid,
    toggleLessonCanceled,
    createSubjectWithRandomColor,
    linkStudentToSubject,
    unlinkStudentFromSubject,
} from '@/services/actions'
import { STUDENT_MESSAGES } from '@/constants/messages'
import { toast } from 'sonner'

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
        studentId: studentId,
        subjectId: '',
        date: new Date(),
        price: '',
        isPaid: false,
        topic: '',
        notes: '',
        recurrence: undefined as any,
        isPaidAll: false,
        seriesPrice: undefined as string | undefined,
    })

    const [deleteStudentConfirm, setDeleteStudentConfirm] = useState(false)
    const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState<string | null>(null)
    const [deleteLessonConfirm, setDeleteLessonConfirm] = useState<string | null>(null)

    const fetchStudent = async () => {
        try {
            const data = await studentsApi.getById(studentId)
            setStudent(data)
        } catch (error) {
            toast.error(STUDENT_MESSAGES.NOT_FOUND)
            router.push('/students')
        } finally {
            setIsLoading(false)
        }
    }

    const loadSubjects = async () => {
        const subjects = await fetchSubjects()
        setAllSubjects(subjects)
    }

    useEffect(() => {
        if (studentId) {
            fetchStudent()
            loadSubjects()
        }
    }, [studentId])

    const handleDeleteStudent = async () => {
        const success = await deleteStudent(studentId)
        if (success) {
            router.push('/students')
        }
        setDeleteStudentConfirm(false)
    }

    const handleDeleteSubject = async () => {
        if (!deleteSubjectConfirm) return

        const success = await unlinkStudentFromSubject(deleteSubjectConfirm, studentId)
        if (success) {
            await fetchStudent()
            await loadSubjects()
        }
        setDeleteSubjectConfirm(null)
    }

    const handleUpdateStudent = async () => {
        setIsSubmitting(true)
        const updated = await updateStudent(studentId, editFormData)

        if (updated) {
            await fetchStudent()
            setIsEditModalOpen(false)
        }
        setIsSubmitting(false)
    }

    const handleAddSubject = async () => {
        setIsSubmitting(true)
        const success = await linkStudentToSubject(selectedSubjectId, studentId)

        if (success) {
            await fetchStudent()
            await loadSubjects()
            setIsAddSubjectModalOpen(false)
        }
        setIsSubmitting(false)
    }

    const handleCreateLesson = async () => {
        setIsSubmitting(true)
        const lesson = await createLesson({
            studentId,
            subjectId: lessonFormData.subjectId || '',
            date: lessonFormData.date,
            price: lessonFormData.price,
            isPaid: lessonFormData.isPaid,
            topic: lessonFormData.topic,
            notes: lessonFormData.notes,
        })

        if (lesson) {
            await fetchStudent()
            setIsCreateLessonModalOpen(false)
        }
        setIsSubmitting(false)
    }

    const handleCreateSubject = async (name: string, forLink: boolean = false) => {
        const newSubject = await createSubjectWithRandomColor(name)

        if (newSubject) {
            if (!forLink) {
                // Link to student if creating from lesson modal
                await linkStudentToSubject(newSubject.id, studentId)
                setLessonFormData(prev => ({ ...prev, subjectId: newSubject.id }))
            } else {
                setSelectedSubjectId(newSubject.id)
                toast.success(`Предмет "${name}" создан. Нажмите "Добавить", чтобы привязать его.`)
            }
            await loadSubjects()
        }
    }

    const handleEditLesson = async (lesson: any) => {
        setLessonFormData({
            studentId: studentId,
            subjectId: lesson.subject?.id || '',
            date: new Date(lesson.date),
            price: lesson.price.toString(),
            isPaid: lesson.isPaid,
            topic: lesson.topic || '',
            notes: lesson.notes || '',
            recurrence: undefined,
            isPaidAll: false,
            seriesPrice: undefined,
        })
        setEditingLessonId(lesson.id)
        setIsEditLessonModalOpen(true)
    }

    const handleUpdateLesson = async () => {
        if (!editingLessonId) return

        setIsSubmitting(true)
        const updated = await updateLesson(editingLessonId, {
            studentId,
            subjectId: lessonFormData.subjectId || undefined,
            date: lessonFormData.date,
            price: lessonFormData.price,
            isPaid: lessonFormData.isPaid,
            topic: lessonFormData.topic,
            notes: lessonFormData.notes,
        })

        if (updated) {
            await fetchStudent()
            setIsEditLessonModalOpen(false)
            setEditingLessonId(null)
        }
        setIsSubmitting(false)
    }

    const handleDeleteLesson = async (lessonId: string) => {
        setDeleteLessonConfirm(lessonId)
    }

    const confirmDeleteLesson = async () => {
        if (!deleteLessonConfirm) return

        const success = await deleteLesson(deleteLessonConfirm)
        if (success) {
            await fetchStudent()
        }
        setDeleteLessonConfirm(null)
    }

    const handleTogglePaidStatus = async (lessonId: string, isPaid: boolean) => {
        const updated = await toggleLessonPaid(lessonId, isPaid)
        if (updated) {
            await fetchStudent()
        }
    }

    const handleToggleCancelLesson = async (lessonId: string, isCanceled: boolean) => {
        const updated = await toggleLessonCanceled(lessonId, isCanceled)
        if (updated) {
            await fetchStudent()
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
            studentId: studentId,
            subjectId: defaultSubjectId,
            date: new Date(),
            price: '',
            isPaid: false,
            topic: '',
            notes: '',
            recurrence: undefined,
            isPaidAll: false,
            seriesPrice: undefined,
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
