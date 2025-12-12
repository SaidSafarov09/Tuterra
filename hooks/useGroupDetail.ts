import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Group, Student, Subject } from '@/types'
import { groupsApi, subjectsApi, studentsApi } from '@/services/api'
import {
    deleteGroup,
    updateGroup,
    fetchGroups,
    fetchSubjects,
    createLesson,
    updateLesson,
    deleteLesson,
    toggleLessonPaid,
    toggleLessonCanceled,
} from '@/services/actions'
import { toast } from 'sonner'

export function useGroupDetail(groupId: string) {
    const router = useRouter()
    const [group, setGroup] = useState<Group | null>(null)
    const [allSubjects, setAllSubjects] = useState<Subject[]>([])
    const [allStudents, setAllStudents] = useState<Student[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isCreateLessonModalOpen, setIsCreateLessonModalOpen] = useState(false)
    const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false)
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
    const [reschedulingLessonId, setReschedulingLessonId] = useState<string | null>(null)

    const [editFormData, setEditFormData] = useState({
        name: '',
        subjectId: '',
        subjectName: '',
        studentIds: [] as string[],
        note: ''
    })

    const [lessonFormData, setLessonFormData] = useState({
        studentId: '', // Not used for group lessons directly, but kept for compatibility
        groupId: groupId,
        subjectId: '',
        date: new Date(),
        duration: 60,
        price: '',
        isPaid: false,
        topic: '',
        notes: '',
        recurrence: undefined as any,
        isPaidAll: false,
        seriesPrice: undefined as string | undefined,
        paidStudentIds: [] as string[]
    })

    const [deleteGroupConfirm, setDeleteGroupConfirm] = useState(false)
    const [deleteLessonConfirm, setDeleteLessonConfirm] = useState<string | null>(null)
    const [isGroupPaymentModalOpen, setIsGroupPaymentModalOpen] = useState(false)
    const [paymentLessonId, setPaymentLessonId] = useState<string | null>(null)

    const fetchGroup = async () => {
        try {
            const data = await groupsApi.getById(groupId)
            setGroup(data)
        } catch (error) {
            toast.error('Группа не найдена')
            router.push('/groups')
        } finally {
            setIsLoading(false)
        }
    }

    const loadData = async () => {
        const [subjects, students] = await Promise.all([
            fetchSubjects(),
            studentsApi.getAll()
        ])
        setAllSubjects(subjects)
        setAllStudents(students)
    }

    useEffect(() => {
        if (groupId) {
            fetchGroup()
            loadData()
        }
    }, [groupId])

    const handleDeleteGroup = async () => {
        const success = await deleteGroup(group?.id || groupId)
        if (success) {
            router.push('/groups')
        }
        setDeleteGroupConfirm(false)
    }

    const handleUpdateGroup = async () => {
        setIsSubmitting(true)
        const updated = await updateGroup(group?.id || groupId, editFormData)

        if (updated) {
            await fetchGroup()
            setIsEditModalOpen(false)
        }
        setIsSubmitting(false)
    }

    const handleCreateLesson = async () => {
        setIsSubmitting(true)
        const lesson = await createLesson({
            groupId: group?.id || groupId,
            subjectId: group?.subjectId || lessonFormData.subjectId || '',
            date: lessonFormData.date,
            price: lessonFormData.price,
            isPaid: lessonFormData.isPaid,
            topic: lessonFormData.topic,
            notes: lessonFormData.notes,
            paidStudentIds: lessonFormData.paidStudentIds
        })

        if (lesson) {
            await fetchGroup()
            setIsCreateLessonModalOpen(false)
        }
        setIsSubmitting(false)
    }

    const handleEditLesson = async (lesson: any) => {
        setLessonFormData({
            studentId: '',
            groupId: groupId,
            subjectId: lesson.subject?.id || group?.subjectId || '',
            date: new Date(lesson.date),
            duration: lesson.duration || 60,
            price: lesson.price.toString(),
            isPaid: lesson.isPaid,
            topic: lesson.topic || '',
            notes: lesson.notes || '',
            recurrence: undefined,
            isPaidAll: false,
            seriesPrice: undefined,
            paidStudentIds: lesson.lessonPayments?.filter((p: any) => p.hasPaid).map((p: any) => p.studentId) || []
        })
        setEditingLessonId(lesson.id)
        setIsEditLessonModalOpen(true)
    }

    const handleUpdateLesson = async () => {
        if (!editingLessonId) return

        setIsSubmitting(true)
        const updated = await updateLesson(editingLessonId, {
            groupId: groupId,
            subjectId: lessonFormData.subjectId || undefined,
            date: lessonFormData.date,
            price: lessonFormData.price,
            isPaid: lessonFormData.isPaid,
            topic: lessonFormData.topic,
            notes: lessonFormData.notes,
            paidStudentIds: lessonFormData.paidStudentIds
        })

        if (updated) {
            await fetchGroup()
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
            await fetchGroup()
        }
        setDeleteLessonConfirm(null)
    }

    const handleTogglePaidStatus = async (lessonId: string, isPaid: boolean) => {

        setPaymentLessonId(lessonId)
        setIsGroupPaymentModalOpen(true)
    }

    const handleGroupPaymentSubmit = async (paidStudentIds: string[]) => {
        if (!paymentLessonId) return

        setIsSubmitting(true)
        try {
            await updateLesson(paymentLessonId, { paidStudentIds })
            await fetchGroup()
            setIsGroupPaymentModalOpen(false)
            setPaymentLessonId(null)
        } catch (error) {
            console.error('Payment update error:', error)
            toast.error('Ошибка при обновлении статуса оплаты')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleCancelLesson = async (lessonId: string, isCanceled: boolean) => {
        const updated = await toggleLessonCanceled(lessonId, isCanceled)
        if (updated) {
            await fetchGroup()
        }
    }

    const handleRescheduleLesson = (lessonId: string) => {
        setReschedulingLessonId(lessonId)
        setIsRescheduleModalOpen(true)
    }

    const handleConfirmReschedule = async (newDate: Date) => {
        if (!reschedulingLessonId || !group?.lessons) return

        setIsSubmitting(true)
        const lesson = group.lessons.find((l) => l.id === reschedulingLessonId)
        if (!lesson) {
            setIsSubmitting(false)
            return
        }

        const updated = await updateLesson(reschedulingLessonId, {
            groupId: group.id,
            subjectId: lesson.subject?.id || '',
            date: newDate,
            price: lesson.price.toString(),
            isPaid: lesson.isPaid,
            topic: lesson.topic || '',
            notes: lesson.notes || '',
        })

        if (updated) {
            await fetchGroup()
            setIsRescheduleModalOpen(false)
            setReschedulingLessonId(null)
        }
        setIsSubmitting(false)
    }

    const openEditModal = () => {
        if (!group) return
        setEditFormData({
            name: group.name,
            subjectId: group.subjectId,
            subjectName: group.subject?.name || '',
            studentIds: group.students.map(s => s.id),
            note: group.note || ''
        })
        setIsEditModalOpen(true)
    }

    const openCreateLessonModal = () => {
        setLessonFormData({
            studentId: '',
            groupId: groupId,
            subjectId: group?.subjectId || '',
            date: new Date(),
            duration: 60,
            price: '',
            isPaid: false,
            topic: '',
            notes: '',
            recurrence: undefined,
            isPaidAll: false,
            seriesPrice: undefined,
            paidStudentIds: []
        })
        setIsCreateLessonModalOpen(true)
    }

    const handleCreateSubject = async (name: string) => {
    }

    return {
        group,
        allSubjects,
        allStudents,
        isLoading,
        isSubmitting,

        isEditModalOpen, setIsEditModalOpen,
        isCreateLessonModalOpen, setIsCreateLessonModalOpen,
        isEditLessonModalOpen, setIsEditLessonModalOpen,
        isRescheduleModalOpen, setIsRescheduleModalOpen,
        isGroupPaymentModalOpen, setIsGroupPaymentModalOpen,
        paymentLessonId,
        reschedulingLessonId,

        editFormData, setEditFormData,
        lessonFormData, setLessonFormData,

        deleteGroupConfirm, setDeleteGroupConfirm,
        deleteLessonConfirm, setDeleteLessonConfirm,

        handleDeleteGroup,
        handleUpdateGroup,
        handleCreateLesson,
        handleUpdateLesson,
        confirmDeleteLesson,
        handleEditLesson,
        handleDeleteLesson,
        handleTogglePaidStatus,
        handleGroupPaymentSubmit,
        handleToggleCancelLesson,
        handleRescheduleLesson,
        handleConfirmReschedule,
        handleCreateSubject,

        openEditModal,
        openCreateLessonModal
    }
}
