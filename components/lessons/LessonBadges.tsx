import React from 'react'
import { LessonStatusBadge } from './LessonStatusBadge'
import { TrialBadge } from './TrialBadge'
import styles from './LessonBadges.module.scss'
import { LessonPayment } from '@/types'
import { getGroupLessonPaymentStatus } from '@/lib/lessonUtils'

interface LessonBadgesProps {
    price: number
    isPaid: boolean
    isTrial?: boolean
    isGroupLesson?: boolean
    totalStudents?: number
    lessonPayments?: LessonPayment[]
    isStudentView?: boolean
}

export function LessonBadges({
    price,
    isPaid,
    isTrial,
    isGroupLesson = false,
    totalStudents = 0,
    lessonPayments = [],
    isStudentView = false
}: LessonBadgesProps) {
    // For group lessons, determine payment status using utility function
    let paymentStatus: 'paid' | 'unpaid' | 'partial' = isPaid ? 'paid' : 'unpaid'

    if (isGroupLesson && lessonPayments) {
        if (isStudentView) {
            // For students in a group lesson, check if *they* have paid.
            // We assume that the lessonPayments array contains an entry for the logged-in student (or we just check if ANY payment is marked as paid if mapped correctly, 
            // but ideally we'd filter by student ID if available. However, in student view, usually the backend returns 
            // relevant data. A common issue is seeing 'partial' because other students paid.
            // If the STUDENT hasn't paid, it should be unpaid, not partial.
            // Since we don't have the current user ID here easily without context, 
            // we rely on how lessonPayments are filtered for the student or passed down.
            // If we can't distinguish, we might need to rely on a prop or check if *any* payment *for me* exists and is paid.
            //
            // Revised logic: In student view, "partial" doesn't make sense for a single student.
            // It's either paid or not. The parent component usually calculates 'isPaid' or passes specific payments.
            // If the parent passed down a filtered lessonPayments for the student, we check that.
            // If the parent passed ALL payments, we might display 'partial' wrongly.
            // Let's assume for now that if isStudentView is true, we should strictly check if *this* student is paid.
            // But we don't have studentId. 
            //
            // Actually, in previous steps (LessonCard.tsx), we calculate `isFullyPaid` for the student view:
            // const isFullyPaid = isStudentView ? (lesson.group ? !!lesson.lessonPayments?.find(p => p.hasPaid) : lesson.isPaid) ...
            // And we pass `isPaid={isFullyPaid}` to LessonBadges if we look closely at LessonCard.tsx call.
            // BUT LessonBadges calculates `paymentStatus` itself for group lessons based on the full array if `isGroupLesson` is true.
            // So we need to override that calculation for student view.

            // If it's student view, simply respect the `isPaid` prop which should already be calculated correctly for the specific student.
            paymentStatus = isPaid ? 'paid' : 'unpaid'
        } else {
            paymentStatus = getGroupLessonPaymentStatus(lessonPayments)
        }
    }

    return (
        <div className={styles.badges}>
            {isTrial && <TrialBadge />}
            <LessonStatusBadge
                price={price}
                isPaid={paymentStatus === 'paid'}
                paymentStatus={paymentStatus}
                isStudentView={isStudentView}
            />
        </div>
    )
}
