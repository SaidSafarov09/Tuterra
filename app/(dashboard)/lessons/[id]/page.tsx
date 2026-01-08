'use client'

import React, { useEffect, useState, use as usePromise } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { format } from 'date-fns'
import { isLessonPast, isLessonOngoing } from '@/lib/lessonTimeUtils'
import { ru } from 'date-fns/locale'
import { Lesson, Student, Subject } from '@/types'
import { useLessonActions } from '@/hooks/useLessonActions'
import { useLessonForm } from '@/hooks/useLessonForm'
import { useCheckLimit } from '@/hooks/useCheckLimit'
import { LessonFormModal } from '@/components/lessons/LessonFormModal'
import { LessonActions } from '@/components/lessons/LessonActions'
import { LessonBadges } from '@/components/lessons/LessonBadges'
import { getLessonTimeInfo } from '@/lib/lessonTimeUtils'
import { ClockIcon, CloseIcon, CheckIcon } from '@/components/icons/Icons'
import styles from './page.module.scss'
import { lessonsApi, studentsApi, subjectsApi } from '@/services/api'
import { LESSON_MESSAGES } from '@/constants/messages'
import { LessonDetailSkeleton } from '@/components/skeletons'
import { RescheduleModal } from '@/components/lessons/RescheduleModal'
import { GroupPaymentModal } from '@/components/lessons/GroupPaymentModal'
import { LessonLinkSection } from '@/components/lessons/LessonLinkSection'


import { useAuthStore } from '@/store/auth'

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { user: currentUser } = useAuthStore()
    const isStudent = currentUser?.role === 'student'
    const router = useRouter()
    const { id } = usePromise(params)
    const [lesson, setLesson] = useState<Lesson | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [cancelConfirm, setCancelConfirm] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])

    const {
        togglePaid,
        toggleCancel,
        deleteLesson,
        handleRescheduleLesson,
        handleConfirmReschedule,
        isLoading: isActionLoading,
        isRescheduleModalOpen,
        setIsRescheduleModalOpen,
        reschedulingLesson,
        isGroupPaymentModalOpen,
        setIsGroupPaymentModalOpen,
        paymentLesson,
    } = useLessonActions(fetchLesson, isStudent)

    const fetchStudents = async () => {
        try {
            const data = await studentsApi.getAll()
            setStudents(data)
        } catch (e) {
            console.error(e)
        }
    }

    const fetchSubjects = async () => {
        try {
            const data = await subjectsApi.getAll()
            setSubjects(data)
        } catch (e) {
            console.error(e)
        }
    }

    const { checkLimit, UpgradeModal } = useCheckLimit()

    const {
        formData,
        setFormData,
        isSubmitting,
        error,
        handleChange,
        handleStudentChange,
        handleCreateStudent: originalHandleCreateStudent,
        handleCreateSubject: originalHandleCreateSubject,
        handleSubmit,
        loadLesson
    } = useLessonForm(
        () => {
            setIsEditModalOpen(false)
            fetchLesson()
        },
        fetchStudents,
        fetchSubjects
    )

    const handleCreateStudent = (name: string) => {
        if (!checkLimit('students', (students || []).length)) return
        originalHandleCreateStudent(name)
    }

    const handleCreateSubject = (name: string) => {
        if (!checkLimit('subjects', (subjects || []).length)) return
        originalHandleCreateSubject(name)
    }

    useEffect(() => {
        if (!id) return
        fetchLesson()
        fetchStudents()
        fetchSubjects()
    }, [id])


    async function fetchLesson() {
        try {
            const data = await lessonsApi.getById(id)
            setLesson(data)
        } catch (error) {
            toast.error('Занятие не найдено')
            router.push('/lessons')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditClick = () => {
        if (lesson) {
            loadLesson(lesson)
            setIsEditModalOpen(true)
        }
    }

    const handleEditSubmit = async () => {
        try {
            await lessonsApi.update(id, {
                ...formData,
                date: formData.date.toISOString(),
                price: parseInt(formData.price),
            })
            toast.success(LESSON_MESSAGES.UPDATED)
            setIsEditModalOpen(false)
            fetchLesson()
        } catch (error) {
            toast.error(LESSON_MESSAGES.UPDATE_ERROR)
        }
    }

    const handleTogglePaid = async () => {
        if (!lesson) return
        await togglePaid(lesson)
    }

    const handleGroupPaymentSubmit = async (paidStudentIds: string[], attendedStudentIds: string[]) => {
        if (!lesson) return

        try {
            await lessonsApi.update(id, {
                paidStudentIds,
                attendedStudentIds,
            })
            toast.success('Статус оплаты обновлен')
            setIsGroupPaymentModalOpen(false)
            fetchLesson()
        } catch (error: any) {
            console.error('Payment update error:', error)
            toast.error(error?.message || 'Ошибка при обновлении статуса оплаты')
        }
    }

    const handleToggleCancel = async () => {
        if (!lesson) return
        setCancelConfirm(false)
        await toggleCancel(lesson)
    }

    const handleDelete = async () => {
        setDeleteConfirm(false)
        await deleteLesson(id)
        router.push('/lessons')
    }

    if (isLoading) {
        return <LessonDetailSkeleton />
    }

    if (!lesson) return null

    const lessonDate = new Date(lesson.date)
    const lessonIsPast = isLessonPast(lesson.date, lesson.duration || 60)
    const lessonIsOngoing = isLessonOngoing(lesson.date, lesson.duration || 60)

    // Определяем статус оплаты
    const isFullyPaid = isStudent
        ? (lesson.userHasPaid ?? (lesson.group
            ? !!lesson.lessonPayments?.find(p => p.hasPaid)
            : lesson.isPaid))
        : (lesson.group
            ? (lesson.lessonPayments?.filter(p => p.hasPaid).length === lesson.group.students?.length && (lesson.group.students?.length || 0) > 0)
            : lesson.isPaid)

    const isPartiallyPaid = !isStudent && lesson.group
        ? (lesson.lessonPayments && lesson.group.students &&
            lesson.lessonPayments.filter(p => p.hasPaid).length > 0 &&
            lesson.lessonPayments.filter(p => p.hasPaid).length < lesson.group.students.length &&
            lesson.group.students.length > 0)
        : false

    return (
        <div>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    ← Назад
                </button>
            </div>

            <div className={`${styles.lessonCard} ${lesson.isCanceled ? styles.lessonCanceled : ''}`}>
                <div className={styles.lessonHeader}>
                    <div>
                        <div className={styles.studentNameRow}>
                            <div onClick={() => {
                                if (isStudent) return
                                lesson?.student ? router.push(`/students/${lesson.student.slug || lesson.student.id}`) : lesson?.group ? router.push(`/groups/${lesson.group.id}`) : null
                            }}>
                                <h1 className={styles.studentName}>
                                    {isStudent
                                        ? (lesson.group ? lesson.group.name : (lesson?.owner?.name || lesson?.owner?.firstName || 'Преподаватель'))
                                        : (lesson?.student?.name || (lesson?.group ? `${lesson.group.name} - группа` : lesson?.groupName ? `${lesson.groupName} - группа` : 'Неизвестно'))
                                    }
                                </h1>
                            </div>
                            {lesson.subject && (
                                <span
                                    className={styles.subjectBadge}
                                    style={{
                                        color: lesson.subject.color,
                                        backgroundColor: lesson.subject.color + '15',
                                        borderColor: lesson.subject.color + '30',
                                    }}
                                >
                                    {lesson.subject.name}
                                </span>
                            )}
                            {lesson.isCanceled && (
                                <span className={styles.canceledBadge}>Отменено</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <p className={styles.lessonDate} style={{ color: lessonIsPast ? 'var(--warning)' : lessonIsOngoing ? 'var(--success)' : 'var(--text-primary)' }}>
                                {lessonIsPast
                                    ? `Занятие было ${format(lessonDate, 'd MMMM', { locale: ru })} в ${format(lessonDate, 'HH:mm')}`
                                    : `${format(lessonDate, 'd MMMM', { locale: ru })} в ${format(lessonDate, 'HH:mm')}`
                                }
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                    <ClockIcon size={16} />
                                    <span className={styles.lessonTime}>
                                        {getLessonTimeInfo(lessonDate, lesson.duration)}
                                    </span>
                                </div>
                                {lessonIsOngoing && (
                                    <span style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 500 }}>
                                        Занятие началось
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.lessonPriceContainer}>
                        <div
                            className={styles.lessonPrice}
                            style={{ color: Number(lesson.price) === 0 ? 'var(--primary)' : isFullyPaid ? 'var(--success)' : 'var(--text-primary)' }}
                        >
                            {isStudent
                                ? (Number(lesson.price) === 0 ? 'Бесплатно' : `${lesson.price} ₽`)
                                : (lesson.group
                                    ? (Number(lesson.price) === 0 ? 'Бесплатно' : `${(lesson.lessonPayments?.filter(p => p.hasPaid).length || 0) * lesson.price} ₽`)
                                    : (Number(lesson.price) === 0 ? 'Бесплатно' : `${lesson.price} ₽`))}
                        </div>
                        <LessonBadges
                            price={lesson.price}
                            isPaid={isFullyPaid}
                            isTrial={lesson.isTrial}
                            isGroupLesson={!!lesson.group}
                            totalStudents={lesson.group?.students?.length || 0}
                            lessonPayments={lesson.lessonPayments}
                            isStudentView={isStudent}
                        />
                    </div>
                </div>

                {lesson.topic && (
                    <div className={styles.topicSection} style={{ borderLeftColor: lesson.subject ? lesson.subject.color : 'var(--primary)', borderLeftWidth: '3px', borderLeftStyle: 'solid' }}>
                        <strong>Тема урока:</strong>
                        <p>{lesson.topic}</p>
                    </div>
                )}

                {lesson.notes && (
                    <div className={styles.notesSection}>
                        <strong>Заметки:</strong>
                        <p>{lesson.notes}</p>
                    </div>
                )}

                {!isStudent && lesson.group && lesson.group.students && lesson.group.students.length > 0 && (
                    <div className={styles.participantsSection}>
                        <strong>Участники занятия:</strong>
                        <div className={styles.participantsList}>
                            {lesson.group.students.map((student) => {
                                const payment = lesson.lessonPayments?.find(p => p.studentId === student.id)
                                const hasPaid = payment?.hasPaid || false
                                const hasAttended = !!payment // если есть запись о платеже, значит присутствовал

                                return (
                                    <div key={student.id} className={styles.participantItem}>
                                        <div className={styles.participantInfo}>
                                            <span className={styles.participantName}>{student.name}</span>
                                            {!hasAttended && (
                                                <span className={styles.absentBadge}>Отсутствовал</span>
                                            )}
                                        </div>
                                        <div className={styles.participantStatus}>
                                            {hasAttended && (
                                                <span className={`${styles.paymentBadge} ${hasPaid ? styles.paid : styles.unpaid}`}>
                                                    {hasPaid ? <><CheckIcon size={14} />Оплачено</> :
                                                        <><CloseIcon size={14} />Не оплачено</>}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <LessonLinkSection
                    lesson={lesson}
                    isStudentView={isStudent}
                />

                <div className={styles.lessonActions}>
                    <LessonActions
                        lesson={lesson}
                        onTogglePaid={handleTogglePaid}
                        onToggleCancel={() => setCancelConfirm(true)}
                        onReschedule={() => lesson && handleRescheduleLesson(lesson)}
                        onEdit={handleEditClick}
                        onDelete={() => setDeleteConfirm(true)}
                        isStudentView={isStudent}
                        isLoading={isActionLoading}
                    />
                </div>
            </div>

            <LessonFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                isEdit={true}
                formData={formData}
                setFormData={setFormData}
                students={students}
                subjects={subjects}
                isSubmitting={isSubmitting}
                error={error}
                onSubmit={handleEditSubmit}
                onStudentChange={handleStudentChange}
                onCreateStudent={handleCreateStudent}
                onCreateSubject={handleCreateSubject}
                handleChange={handleChange}
            />

            <ConfirmDialog
                isOpen={deleteConfirm}
                onClose={() => setDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Удалить занятие?"
                message="Вы уверены, что хотите удалить это занятие? Это действие нельзя отменить."
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={cancelConfirm}
                onClose={() => setCancelConfirm(false)}
                onConfirm={handleToggleCancel}
                title={lesson.isCanceled ? 'Восстановить занятие?' : 'Отменить занятие?'}
                message={
                    lesson.isCanceled
                        ? 'Вы уверены, что хотите восстановить это занятие?'
                        : 'Вы уверены, что хотите отменить это занятие?'
                }
                confirmText={lesson.isCanceled ? 'Восстановить' : 'Отменить'}
                cancelText="Назад"
                variant={lesson.isCanceled ? 'info' : 'danger'}
            />

            <RescheduleModal
                isOpen={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                onConfirm={handleConfirmReschedule}
                currentDate={reschedulingLesson ? new Date(reschedulingLesson.date) : new Date()}
                isSubmitting={isActionLoading}
                isStudentView={isStudent}
            />

            <GroupPaymentModal
                isOpen={isGroupPaymentModalOpen}
                onClose={() => setIsGroupPaymentModalOpen(false)}
                onSubmit={handleGroupPaymentSubmit}
                students={paymentLesson?.group?.students || lesson?.group?.students || []}
                initialPaidStudentIds={paymentLesson?.lessonPayments?.filter((p: any) => p.hasPaid).map((p: any) => p.studentId) || lesson?.lessonPayments?.filter((p: any) => p.hasPaid).map((p: any) => p.studentId) || []}
                initialAttendedStudentIds={paymentLesson?.lessonPayments?.map((p: any) => p.studentId) || lesson?.lessonPayments?.map((p: any) => p.studentId) || []}
                isSubmitting={isActionLoading}
                price={Number(paymentLesson?.price || lesson?.price || 0)}
                lessonDate={paymentLesson?.date || lesson?.date}
            />
            {UpgradeModal}
        </div>
    )
}