import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Student, Subject, Group } from '@/types'
import { studentsApi, subjectsApi } from '@/services/api'
import {
    deleteStudent,
    updateStudent,
    fetchStudents,
    fetchSubjects,
    fetchGroups,
    createLesson,
    updateLesson,
    deleteLesson,
    toggleLessonPaid,
    toggleLessonCanceled,
    createSubjectWithRandomColor,
    linkStudentToSubject,
    unlinkStudentFromSubject,
    linkStudentToGroup,
    unlinkStudentFromGroup,
} from '@/services/actions'
import { unlinkStudentFromSubjectWithLessonsNotification } from '@/services/actions'
import { STUDENT_MESSAGES } from '@/constants/messages'
import { toast } from 'sonner'

import { ContactType } from '@/lib/contactUtils'

export function useStudentDetail(studentId: string) {
    const router = useRouter()
    const [student, setStudent] = useState<Student | null>(null)
    const [allSubjects, setAllSubjects] = useState<Subject[]>([])
    const [allGroups, setAllGroups] = useState<Group[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false)
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
    const [isCreateLessonModalOpen, setIsCreateLessonModalOpen] = useState(false)
    const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false)
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
    const [reschedulingLessonId, setReschedulingLessonId] = useState<string | null>(null)

    const [editFormData, setEditFormData] = useState({
        name: '',
        contact: '',
        contactType: 'phone' as ContactType,
        parentContact: '',
        parentContactType: 'phone' as ContactType,
        note: '',
    })
    const [selectedSubjectId, setSelectedSubjectId] = useState('')
    const [selectedGroupId, setSelectedGroupId] = useState('')
    const [lessonFormData, setLessonFormData] = useState({
        studentId: studentId,
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
        planTopicId: undefined as string | undefined,
    })

    const [isGroupPaymentModalOpen, setIsGroupPaymentModalOpen] = useState(false)
    const [paymentLessonId, setPaymentLessonId] = useState<string | null>(null)
    const [paymentLessonDate, setPaymentLessonDate] = useState<string | null>(null)

    const [deleteStudentConfirm, setDeleteStudentConfirm] = useState(false)
    const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState<string | null>(null)
    const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<string | null>(null)
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

    const loadGroups = async () => {
        const groups = await fetchGroups()
        setAllGroups(groups)
    }

    useEffect(() => {
        if (studentId) {
            fetchStudent()
            loadSubjects()
            loadGroups()
        }
    }, [studentId])

    const handleDeleteStudent = async () => {
        const success = await deleteStudent(student?.id || studentId)
        if (success) {
            router.push('/students')
        }
        setDeleteStudentConfirm(false)
    }

    const handleDeleteSubject = async () => {
        if (!deleteSubjectConfirm) return

        const subject = allSubjects.find(s => s.id === deleteSubjectConfirm)
        const subjectName = subject?.name || 'предмет'

        const studentLessons = student?.lessons || []

        const success = await unlinkStudentFromSubjectWithLessonsNotification(
            deleteSubjectConfirm,
            student?.id || studentId,
            subjectName,
            studentLessons
        )

        if (success) {
            await fetchStudent()
            await loadSubjects()
        }
        setDeleteSubjectConfirm(null)
    }

    const handleUpdateStudent = async () => {
        setIsSubmitting(true)
        const updated = await updateStudent(student?.id || studentId, editFormData)

        if (updated) {
            await fetchStudent()
            setIsEditModalOpen(false)
        }
        setIsSubmitting(false)
    }

    const handleAddSubject = async () => {
        if (!selectedSubjectId) {
            toast.error('Выберите предмет')
            return
        }
        setIsSubmitting(true)
        const success = await linkStudentToSubject(selectedSubjectId, student?.id || studentId)

        if (success) {
            await fetchStudent()
            await loadSubjects()
            setIsAddSubjectModalOpen(false)
        }
        setIsSubmitting(false)
    }

    const handleAddGroup = async () => {
        if (!selectedGroupId) {
            toast.error('Выберите группу')
            return
        }
        setIsSubmitting(true)
        const success = await linkStudentToGroup(selectedGroupId, student?.id || studentId)

        if (success) {
            await fetchStudent()
            await loadGroups()
            setIsAddGroupModalOpen(false)
        }
        setIsSubmitting(false)
    }

    const handleDeleteGroup = async () => {
        if (!deleteGroupConfirm) return

        const success = await unlinkStudentFromGroup(deleteGroupConfirm, student?.id || studentId)

        if (success) {
            await fetchStudent()
            await loadGroups()
        }
        setDeleteGroupConfirm(null)
    }

    const handleCreateLesson = async () => {
        setIsSubmitting(true)
        const lesson = await createLesson({
            studentId: student?.id || studentId,
            subjectId: lessonFormData.subjectId || '',
            date: lessonFormData.date,
            price: lessonFormData.price,
            isPaid: lessonFormData.isPaid,
            topic: lessonFormData.topic,
            notes: lessonFormData.notes,
            planTopicId: lessonFormData.planTopicId,
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

                await linkStudentToSubject(newSubject.id, student?.id || studentId)
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
            studentId: student?.id || studentId,
            subjectId: lesson.subject?.id || '',
            date: new Date(lesson.date),
            duration: lesson.duration || 60,
            price: lesson.price.toString(),
            isPaid: lesson.isPaid,
            topic: lesson.topic || '',
            notes: lesson.notes || '',
            recurrence: undefined,
            isPaidAll: false,
            seriesPrice: undefined,
            planTopicId: lesson.planTopicId || undefined,
        })
        setEditingLessonId(lesson.id)
        setIsEditLessonModalOpen(true)
    }

    const handleUpdateLesson = async () => {
        if (!editingLessonId) return

        setIsSubmitting(true)
        const updated = await updateLesson(editingLessonId, {
            studentId: student?.id || studentId,
            subjectId: lessonFormData.subjectId || undefined,
            date: lessonFormData.date,
            price: lessonFormData.price,
            isPaid: lessonFormData.isPaid,
            topic: lessonFormData.topic,
            notes: lessonFormData.notes,
            planTopicId: lessonFormData.planTopicId,
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

    const handleGroupPaymentSubmit = async (paidStudentIds: string[], attendedStudentIds: string[]) => {
        if (!paymentLessonId) return

        setIsSubmitting(true)
        try {
            await updateLesson(paymentLessonId, { paidStudentIds, attendedStudentIds }, { showToast: false })
            if (attendedStudentIds.length === 0) {
                toast.warning('Никто не пришел на занятие. Занятие отменено.')
            } else {
                toast.success('Статус оплаты обновлен')
            }
            await fetchStudent()
            setIsGroupPaymentModalOpen(false)
            setPaymentLessonId(null)
            setPaymentLessonDate(null)
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
            await fetchStudent()
        }
    }

    const handleRescheduleLesson = (lessonId: string) => {
        setReschedulingLessonId(lessonId)
        setIsRescheduleModalOpen(true)
    }

    const handleConfirmReschedule = async (newDate: Date) => {
        if (!reschedulingLessonId || !student?.lessons) return

        setIsSubmitting(true)
        const lesson = student.lessons.find((l) => l.id === reschedulingLessonId)
        if (!lesson) {
            setIsSubmitting(false)
            return
        }

        const updated = await updateLesson(reschedulingLessonId, {
            studentId: student.id,
            subjectId: lesson.subject?.id || '',
            date: newDate,
            price: lesson.price.toString(),
            isPaid: lesson.isPaid,
            topic: lesson.topic || '',
            notes: lesson.notes || '',
        })

        if (updated) {
            await fetchStudent()
            setIsRescheduleModalOpen(false)
            setReschedulingLessonId(null)
        }
        setIsSubmitting(false)
    }

    const openEditModal = () => {
        if (!student) return
        setEditFormData({
            name: student.name,
            contact: student.contact || '',
            contactType: (student.contactType as ContactType) || 'phone',
            parentContact: student.parentContact || '',
            parentContactType: (student.parentContactType as ContactType) || 'phone',
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
            duration: 60,
            price: '',
            isPaid: false,
            topic: '',
            notes: '',
            recurrence: undefined,
            isPaidAll: false,
            seriesPrice: undefined,
            planTopicId: undefined,
        })
        setIsCreateLessonModalOpen(true)
    }

    return {
        student,
        allSubjects,
        allGroups,
        isLoading,
        isSubmitting,


        isEditModalOpen, setIsEditModalOpen,
        isAddSubjectModalOpen, setIsAddSubjectModalOpen,
        isAddGroupModalOpen, setIsAddGroupModalOpen,
        isCreateLessonModalOpen, setIsCreateLessonModalOpen,
        isEditLessonModalOpen, setIsEditLessonModalOpen,
        isRescheduleModalOpen, setIsRescheduleModalOpen,
        isGroupPaymentModalOpen, setIsGroupPaymentModalOpen,
        paymentLessonId, setPaymentLessonId,
        paymentLessonDate, setPaymentLessonDate,
        handleGroupPaymentSubmit,
        reschedulingLessonId,


        editFormData, setEditFormData,
        selectedSubjectId, setSelectedSubjectId,
        selectedGroupId, setSelectedGroupId,
        lessonFormData, setLessonFormData,


        deleteStudentConfirm, setDeleteStudentConfirm,
        deleteSubjectConfirm, setDeleteSubjectConfirm,
        deleteGroupConfirm, setDeleteGroupConfirm,
        deleteLessonConfirm, setDeleteLessonConfirm,


        handleDeleteStudent,
        handleDeleteSubject,
        handleDeleteGroup,
        handleUpdateStudent,
        handleAddSubject,
        handleAddGroup,
        handleCreateLesson,
        handleUpdateLesson,
        confirmDeleteLesson,
        handleCreateSubject,
        handleEditLesson,
        handleDeleteLesson,
        handleTogglePaidStatus,
        handleToggleCancelLesson,
        handleRescheduleLesson,
        handleConfirmReschedule,


        openEditModal,
        openCreateLessonModal
    }
}
