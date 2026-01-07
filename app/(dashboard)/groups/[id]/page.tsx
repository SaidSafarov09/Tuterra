'use client'

import React, { use as usePromise } from 'react'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { GroupHeader } from '@/components/groups/GroupHeader'
import { StudentLessons } from '@/components/students/StudentLessons' // Reusing StudentLessons for now
import { GroupModals } from '@/components/groups/GroupModals'
import { GroupNote } from '@/components/groups/GroupNote'
import { GroupPlan } from '@/components/groups/GroupPlan'
import { useGroupDetail } from '@/hooks/useGroupDetail'
import { StudentDetailSkeleton } from '@/components/skeletons'
import { useCheckLimit } from '@/hooks/useCheckLimit'
import { RescheduleModal } from '@/components/lessons/RescheduleModal'
import { GroupPaymentModal } from '@/components/lessons/GroupPaymentModal'

import { useAuthStore } from '@/store/auth'

export default function GroupDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = usePromise(params)
    const { user } = useAuthStore()
    const router = useRouter()
    const isMobile = useMediaQuery('(max-width: 768px)')
    const isStudent = user?.role === 'student'

    const {
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
        handleGroupPaymentSubmit,
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
        handleToggleCancelLesson,
        handleRescheduleLesson,
        handleConfirmReschedule,
        handleCreateSubject: originalHandleCheckSubject,

        openEditModal,
        openCreateLessonModal
    } = useGroupDetail(id)

    const { checkLimit, UpgradeModal } = useCheckLimit()

    const handleCreateSubjectWrapped = (name: string) => {
        if (!checkLimit('subjects', allSubjects.length)) return
        originalHandleCheckSubject(name)
    }

    if (isLoading) {
        return <StudentDetailSkeleton />
    }

    if (!group) {
        return null
    }

    return (
        <div>
            <GroupHeader
                group={group}
                onEdit={isStudent ? undefined : openEditModal}
                onCreateLesson={isStudent ? undefined : openCreateLessonModal}
                onDelete={isStudent ? undefined : () => setDeleteGroupConfirm(true)}
            />

            <GroupNote group={group} />

            <GroupPlan group={group} />

            <StudentLessons
                lessons={(group.lessons || []).map((l) => ({
                    ...l,
                    group: { id: group.id, name: group.name, students: group.students },
                    subject: group.subject || null,
                }))}
                student={{ id: group.id, name: group.name } as any}
                onCreateLesson={isStudent ? undefined : openCreateLessonModal}
                onEditLesson={isStudent ? undefined : handleEditLesson}
                onDeleteLesson={isStudent ? undefined : handleDeleteLesson}
                onTogglePaidStatus={isStudent ? undefined : handleTogglePaidStatus}
                onToggleCancelLesson={handleToggleCancelLesson}
                onRescheduleLesson={handleRescheduleLesson}
                isStudentView={isStudent}
                emptyText="У этой группы пока нет занятий"
                isLocked={group.isLocked}
                onLockedAction={(message) => checkLimit('students', 0, message)}
            />

            <GroupModals
                group={group}
                allSubjects={allSubjects}
                allStudents={allStudents}
                isSubmitting={isSubmitting}
                isEditModalOpen={isEditModalOpen}
                onCloseEditModal={() => setIsEditModalOpen(false)}
                onSubmitEdit={handleUpdateGroup}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                isCreateLessonModalOpen={isCreateLessonModalOpen}
                onCloseCreateLessonModal={() => setIsCreateLessonModalOpen(false)}
                onSubmitCreateLesson={handleCreateLesson}
                lessonFormData={lessonFormData}
                setLessonFormData={setLessonFormData}
                isEditLessonModalOpen={isEditLessonModalOpen}
                onCloseEditLessonModal={() => setIsEditLessonModalOpen(false)}
                onSubmitEditLesson={handleUpdateLesson}
                onCreateSubject={handleCreateSubjectWrapped}
            />

            <ConfirmDialog
                isOpen={deleteGroupConfirm}
                onClose={() => setDeleteGroupConfirm(false)}
                onConfirm={handleDeleteGroup}
                title="Удалить группу?"
                message="Вы уверены, что хотите удалить эту группу? Все ближайшие занятия связанные с этой группой будут удалены. Это действие нельзя отменить."
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={!!deleteLessonConfirm}
                onClose={() => setDeleteLessonConfirm(null)}
                onConfirm={confirmDeleteLesson}
                title="Удалить занятие?"
                message="Вы уверены, что хотите удалить это занятие?"
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
            />

            <RescheduleModal
                isOpen={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                onConfirm={handleConfirmReschedule}
                currentDate={
                    reschedulingLessonId
                        ? new Date(group.lessons?.find((l) => l.id === reschedulingLessonId)?.date || new Date())
                        : new Date()
                }
                isSubmitting={isSubmitting}
            />

            <GroupPaymentModal
                isOpen={isGroupPaymentModalOpen}
                onClose={() => setIsGroupPaymentModalOpen(false)}
                onSubmit={handleGroupPaymentSubmit}
                students={group.students || []}
                initialPaidStudentIds={
                    paymentLessonId
                        ? group.lessons?.find(l => l.id === paymentLessonId)?.lessonPayments?.filter(p => p.hasPaid).map(p => p.studentId) || []
                        : []
                }
                initialAttendedStudentIds={
                    paymentLessonId
                        ? group.lessons?.find(l => l.id === paymentLessonId)?.lessonPayments?.map(p => p.studentId) || []
                        : []
                }
                isSubmitting={isSubmitting}
                price={paymentLessonId ? Number(group.lessons?.find(l => l.id === paymentLessonId)?.price) : 0}
                lessonDate={paymentLessonId ? group.lessons?.find(l => l.id === paymentLessonId)?.date : undefined}
            />
            {UpgradeModal}
        </div>
    )
}
