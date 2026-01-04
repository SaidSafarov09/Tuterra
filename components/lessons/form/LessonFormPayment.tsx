import React from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { Student, Group } from '@/types'
import styles from './LessonForm.module.scss'

interface LessonFormPaymentProps {
    isPaid: boolean
    isPaidAll?: boolean
    paidStudentIds?: string[]
    price: string
    seriesPrice?: string
    isTrial: boolean
    activeTab: 'single' | 'recurring'
    groupId?: string
    selectedGroup?: Group | null
    onPaidChange: (value: boolean) => void
    onPaidAllChange?: (value: boolean) => void
    onPaidStudentsToggle?: (studentId: string) => void
    disabled?: boolean
}

export function LessonFormPayment({
    isPaid,
    isPaidAll,
    paidStudentIds,
    price,
    seriesPrice,
    isTrial,
    activeTab,
    groupId,
    selectedGroup,
    onPaidChange,
    onPaidAllChange,
    onPaidStudentsToggle,
    disabled
}: LessonFormPaymentProps) {
    const showPayment = (price !== '0' && price !== '') ||
        (activeTab === 'recurring' && seriesPrice && seriesPrice !== '0')

    if (!showPayment) return null

    return (
        <div className={styles.paymentSection}>
            {!groupId ? (
                <>
                    {price !== '0' && price !== '' && (
                        <Checkbox
                            checked={isPaid}
                            onChange={(e) => onPaidChange(e.target.checked)}
                            label={
                                activeTab === 'recurring'
                                    ? 'Оплачено только первое занятие'
                                    : 'Оплачено'
                            }
                            disabled={disabled}
                        />
                    )}

                    {activeTab === 'recurring' && onPaidAllChange && (
                        <Checkbox
                            checked={isPaidAll || false}
                            onChange={(e) => onPaidAllChange(e.target.checked)}
                            label={
                                isTrial || (price === '0' && seriesPrice && seriesPrice !== '0')
                                    ? "Все последующие занятия серии оплачены"
                                    : "Оплачены все занятия серии"
                            }
                            disabled={disabled}
                        />
                    )}
                </>
            ) : (
                <div className={styles.groupPaymentBlock}>
                    <label className={styles.label}>Оплаты участников</label>
                    <div className={styles.groupStudentsList}>
                        {selectedGroup?.students.map(student => (
                            <Checkbox
                                key={student.id}
                                checked={paidStudentIds?.includes(student.id) || false}
                                onChange={() => onPaidStudentsToggle?.(student.id)}
                                label={`${student.name} (Оплатил)`}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
