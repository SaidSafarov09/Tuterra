"use client";

import React, { use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StudentHeader } from "@/components/students/StudentHeader";
import { StudentSubjects } from "@/components/students/StudentSubjects";
import { StudentGroups } from "@/components/students/StudentGroups";
import { StudentLessons } from "@/components/students/StudentLessons";
import { StudentModals } from "@/components/students/StudentModals";
import { useStudentDetail } from "@/hooks/useStudentDetail";
import { StudentDetailSkeleton } from "@/components/skeletons";
import { StudentNote } from "@/components/students/StudentNote";
import { RescheduleModal } from "@/components/lessons/RescheduleModal";
import { GroupPaymentModal } from "@/components/lessons/GroupPaymentModal";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    student,
    allSubjects,
    allGroups,
    isLoading,
    isSubmitting,

    isEditModalOpen,
    setIsEditModalOpen,
    isAddSubjectModalOpen,
    setIsAddSubjectModalOpen,
    isAddGroupModalOpen,
    setIsAddGroupModalOpen,
    isCreateLessonModalOpen,
    setIsCreateLessonModalOpen,

    editFormData,
    setEditFormData,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedGroupId,
    setSelectedGroupId,
    lessonFormData,
    setLessonFormData,

    deleteStudentConfirm,
    setDeleteStudentConfirm,
    deleteSubjectConfirm,
    setDeleteSubjectConfirm,
    deleteGroupConfirm,
    setDeleteGroupConfirm,

    handleDeleteStudent,
    handleDeleteSubject,
    handleUpdateStudent,
    handleAddSubject,
    handleAddGroup,
    handleCreateLesson,
    handleDeleteGroup,
    handleCreateSubject,
    handleEditLesson,
    handleDeleteLesson,
    handleTogglePaidStatus,
    handleToggleCancelLesson,
    handleRescheduleLesson,
    handleConfirmReschedule,

    isRescheduleModalOpen,
    setIsRescheduleModalOpen,
    reschedulingLessonId,

    openEditModal,
    openCreateLessonModal,


    isEditLessonModalOpen,
    setIsEditLessonModalOpen,
    deleteLessonConfirm,
    setDeleteLessonConfirm,
    handleUpdateLesson,
    confirmDeleteLesson,
    isGroupPaymentModalOpen,
    setIsGroupPaymentModalOpen,
    paymentLessonId,
    setPaymentLessonId,
    paymentLessonDate,
    setPaymentLessonDate,
    handleGroupPaymentSubmit,
  } = useStudentDetail(id);

  const paymentGroupLesson = paymentLessonId
    ? student?.groups?.flatMap(g => (g.lessons || []).map(l => ({ ...l, group: g }))).find(l => l.id === paymentLessonId)
    : null;

  const handleCreateLessonMobile = () => {
    openCreateLessonModal();
  };


  const handleRescheduleLessonMobile = (lessonId: string) => {
    handleRescheduleLesson(lessonId)
  }

  if (isLoading) {
    return <StudentDetailSkeleton />;
  }

  if (!student) {
    return null;
  }

  return (
    <div>
      <StudentHeader
        student={student}
        onEdit={openEditModal}
        onCreateLesson={handleCreateLessonMobile}
        onDelete={() => setDeleteStudentConfirm(true)}
      />
      <StudentSubjects
        student={student}
        onAddSubject={() => {
          setSelectedSubjectId("");
          setIsAddSubjectModalOpen(true);
        }}
        onDeleteSubject={(subjectId) => setDeleteSubjectConfirm(subjectId)}
      />
      <StudentGroups
        student={student}
        onAddGroup={() => {
          setSelectedGroupId("");
          setIsAddGroupModalOpen(true);
        }}
        onDeleteGroup={(groupId) => setDeleteGroupConfirm(groupId)}
      />

      <StudentNote student={student} />

      <StudentLessons
        lessons={[
          ...(student.lessons || []).map((l) => ({
            ...l,
            student: { id: student.id, name: student.name },
            subject: l.subject || null,
          })),
          ...(student.groups || []).flatMap((g) =>
            (g.lessons || []).map((l) => {
              const payment = l.lessonPayments?.find(p => p.studentId === student.id)
              return {
                ...l,
                student: { id: student.id, name: student.name },
                subject: l.subject || null,
                group: g,
                isPaid: payment ? payment.hasPaid : false,
              }
            })
          ),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
        student={student}
        onCreateLesson={handleCreateLessonMobile}
        onEditLesson={handleEditLesson}
        onDeleteLesson={handleDeleteLesson}
        onTogglePaidStatus={handleTogglePaidStatus}
        onToggleCancelLesson={handleToggleCancelLesson}
        onRescheduleLesson={handleRescheduleLessonMobile}
        onOpenGroupPayment={(l) => {
            setPaymentLessonId(l.id);
            setPaymentLessonDate(l.date);
            setIsGroupPaymentModalOpen(true);
        }}
      />

      <StudentModals
        student={student}
        allSubjects={allSubjects}
        isSubmitting={isSubmitting}
        isEditModalOpen={isEditModalOpen}
        onCloseEditModal={() => setIsEditModalOpen(false)}
        onSubmitEdit={handleUpdateStudent}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        isAddSubjectModalOpen={isAddSubjectModalOpen}
        onCloseAddSubjectModal={() => setIsAddSubjectModalOpen(false)}
        onSubmitAddSubject={handleAddSubject}
        selectedSubjectId={selectedSubjectId}
        setSelectedSubjectId={setSelectedSubjectId}
        onCreateSubjectForLink={(name) => handleCreateSubject(name, true)}
        allGroups={allGroups}
        isAddGroupModalOpen={isAddGroupModalOpen}
        onCloseAddGroupModal={() => setIsAddGroupModalOpen(false)}
        onSubmitAddGroup={handleAddGroup}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        isCreateLessonModalOpen={isCreateLessonModalOpen}
        onCloseCreateLessonModal={() => setIsCreateLessonModalOpen(false)}
        onSubmitCreateLesson={handleCreateLesson}
        lessonFormData={lessonFormData}
        setLessonFormData={setLessonFormData}
        onCreateSubject={(name) => handleCreateSubject(name, false)}
        isEditLessonModalOpen={isEditLessonModalOpen}
        onCloseEditLessonModal={() => setIsEditLessonModalOpen(false)}
        onSubmitEditLesson={handleUpdateLesson}
      />

      <ConfirmDialog
        isOpen={deleteStudentConfirm}
        onClose={() => setDeleteStudentConfirm(false)}
        onConfirm={handleDeleteStudent}
        title="Удалить ученика?"
        message="Вы уверены, что хотите удалить этого ученика? Все занятия и история оплат также будут удалены. Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!deleteSubjectConfirm}
        onClose={() => setDeleteSubjectConfirm(null)}
        onConfirm={handleDeleteSubject}
        title="Удалить предмет?"
        message="Вы уверены, что хотите удалить этот предмет у ученика?"
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!deleteGroupConfirm}
        onClose={() => setDeleteGroupConfirm(null)}
        onConfirm={handleDeleteGroup}
        title="Удалить из группы?"
        message="Вы уверены, что хотите исключить ученика из этой группы?"
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
            ? new Date(student?.lessons?.find((l) => l.id === reschedulingLessonId)?.date || new Date())
            : new Date()
        }
        isSubmitting={isSubmitting}
      />

      <GroupPaymentModal
          isOpen={isGroupPaymentModalOpen}
          onClose={() => setIsGroupPaymentModalOpen(false)}
          onSubmit={handleGroupPaymentSubmit}
          students={paymentGroupLesson?.group?.students || []}
          initialPaidStudentIds={
              paymentGroupLesson?.lessonPayments?.filter(p => p.hasPaid).map(p => p.studentId) || []
          }
          isSubmitting={isSubmitting}
          price={paymentGroupLesson ? Number(paymentGroupLesson.price) : 0}
          lessonDate={paymentGroupLesson ? paymentGroupLesson.date : undefined}
      />
    </div>
  );
}
