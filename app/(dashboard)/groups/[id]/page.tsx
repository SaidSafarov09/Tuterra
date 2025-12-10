'use client'

import React, { use as usePromise } from 'react'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { GroupHeader } from '@/components/groups/GroupHeader'
import { StudentLessons } from '@/components/students/StudentLessons' // Reusing StudentLessons for now
import { GroupModals } from '@/components/groups/GroupModals'
import { useGroupDetail } from '@/hooks/useGroupDetail'
import { StudentDetailSkeleton } from '@/components/skeletons'
import { RescheduleModal } from '@/components/lessons/RescheduleModal'

export default function GroupDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = usePromise(params)
    const router = useRouter()
    const isMobile = useMediaQuery('(max-width: 768px)')

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
        handleCreateSubject,

        openEditModal,
        openCreateLessonModal
    } = useGroupDetail(id)

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
                onEdit={openEditModal}
                onCreateLesson={openCreateLessonModal}
                onDelete={() => setDeleteGroupConfirm(true)}
            />

            <StudentLessons
                lessons={(group.lessons || []).map((l) => ({
                    ...l,
                    group: { id: group.id, name: group.name },
                    subject: group.subject || null,
                }))}
                student={{ id: group.id, name: group.name } as any} // Mock student for compatibility
                onCreateLesson={openCreateLessonModal}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handleDeleteLesson}
                onTogglePaidStatus={handleTogglePaidStatus}
                onToggleCancelLesson={handleToggleCancelLesson}
                onRescheduleLesson={handleRescheduleLesson}
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
                onCreateSubject={handleCreateSubject}
            />

            <ConfirmDialog
                isOpen={deleteGroupConfirm}
                onClose={() => setDeleteGroupConfirm(false)}
                onConfirm={handleDeleteGroup}
                title="Удалить группу?"
                message="Вы уверены, что хотите удалить эту группу? Все занятия и история оплат также будут удалены. Это действие нельзя отменить."
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
        </div>
    )
}
