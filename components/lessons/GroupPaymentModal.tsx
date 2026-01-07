'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Checkbox } from '@/components/ui/Checkbox'
import { toast } from 'sonner'
import { Users, CheckCircle2, XCircle } from 'lucide-react'
import styles from './GroupPaymentModal.module.scss'
import { MoneyIcon } from '../icons/Icons'

interface GroupPaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (paidStudentIds: string[], attendedStudentIds: string[]) => void
    students: { id: string; name: string }[]
    initialPaidStudentIds: string[]
    initialAttendedStudentIds?: string[]
    isSubmitting: boolean
    price?: number
    lessonDate?: Date | string
}

export function GroupPaymentModal({
    isOpen,
    onClose,
    onSubmit,
    students,
    initialPaidStudentIds,
    initialAttendedStudentIds,
    isSubmitting,
    price,
    lessonDate
}: GroupPaymentModalProps) {
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { attended: boolean, paid: boolean }>>({});

    const prevIsOpenRef = useRef<boolean>(false)

    useEffect(() => {
        const prev = prevIsOpenRef.current
        if (!prev && isOpen) {
            const initialRecords: Record<string, { attended: boolean, paid: boolean }> = {};
            students.forEach(student => {
                initialRecords[student.id] = { attended: false, paid: false };
            });

            const attendedIds = initialAttendedStudentIds || initialPaidStudentIds
            attendedIds.forEach(studentId => {
                if (initialRecords[studentId]) {
                    initialRecords[studentId] = {
                        attended: true,
                        paid: initialPaidStudentIds.includes(studentId)
                    };
                }
            });

            setAttendanceRecords(initialRecords);
        }
        prevIsOpenRef.current = isOpen
    }, [isOpen, students, initialPaidStudentIds, initialAttendedStudentIds])

    const handleToggleAttendance = (studentId: string) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                attended: !prev[studentId]?.attended
            }
        }))
    }

    const handleTogglePayment = (studentId: string) => {
        setAttendanceRecords(prev => {
            const currentRecord = prev[studentId]
            if (!currentRecord?.attended) {
                return prev
            }
            return {
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    paid: !prev[studentId]?.paid
                }
            }
        })
    }

    const isPast = lessonDate ? new Date(lessonDate) < new Date() : false

    const handleSubmit = () => {
        const paidStudentIds = Object.entries(attendanceRecords)
            .filter(([_, record]) => record.paid)
            .map(([studentId, _]) => studentId)

        const attendedStudentIds = Object.entries(attendanceRecords)
            .filter(([_, record]) => record.attended)
            .map(([studentId, _]) => studentId)

        if (attendedStudentIds.length === 0 && !isPast) {
            toast.warning('Никто не пришел на занятие. Занятие будет отменено.')
        }

        onSubmit(paidStudentIds, attendedStudentIds)
    }

    const presentCount = Object.values(attendanceRecords).filter(record => record.attended).length
    const paidCount = Object.values(attendanceRecords).filter(record => record.paid && record.attended).length
    const totalCount = students.length
    const amountDue = paidCount * (price || 0)

    // Определяем статус оплаты занятия
    const paymentStatus = presentCount === 0
        ? 'none'
        : paidCount === 0
            ? 'unpaid'
            : paidCount === presentCount
                ? 'paid'
                : 'partial'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Управление оплатой и посещаемостью"
            maxWidth="650px"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitText={isSubmitting ? 'Сохранение...' : 'Сохранить'}
                />
            }
        >
            <div className={styles.content}>
                {lessonDate && (
                    <div className={styles.dateCard}>
                        <div className={styles.dateIcon}>
                            <Users size={18} />
                        </div>
                        <div className={styles.dateInfo}>
                            <span className={styles.dateLabel}>Занятие</span>
                            <span className={styles.dateValue}>
                                {typeof lessonDate === 'string'
                                    ? new Date(lessonDate).toLocaleString('ru-RU', {
                                        day: 'numeric',
                                        month: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    : (lessonDate as Date).toLocaleString('ru-RU', {
                                        day: 'numeric',
                                        month: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                }
                            </span>
                        </div>
                    </div>
                )}

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                            <Users size={20} />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statLabel}>Присутствовали</span>
                            <span className={styles.statValue}>
                                {presentCount} <span className={styles.statTotal}>из {totalCount}</span>
                            </span>
                        </div>
                    </div>

                    {price && price > 0 && (
                        <>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.statIconPaid}`}>
                                    <MoneyIcon size={24} color="#10B981" />
                                </div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statLabel}>Оплатили</span>
                                    <span className={styles.statValue}>
                                        {paidCount} <span className={styles.statTotal}>из {presentCount || 1}</span>
                                    </span>
                                </div>
                            </div>

                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.statIconAmount}`}>
                                    <MoneyIcon size={24} color="#6366f1" />
                                </div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statLabel}>Сумма</span>
                                    <span className={styles.statValue}>{amountDue} ₽</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {paymentStatus === 'none' && !isPast && (
                    <div className={styles.warningBanner}>
                        <XCircle size={18} />
                        <span>Если никто не пришел, занятие будет отменено</span>
                    </div>
                )}

                {paymentStatus === 'paid' && presentCount > 0 && (
                    <div className={styles.successBanner}>
                        <CheckCircle2 size={18} />
                        <span>Все присутствовавшие ученики оплатили занятие</span>
                    </div>
                )}

                {paymentStatus === 'partial' && (
                    <div className={styles.partialBanner}>
                        <span>Частично оплачено: {paidCount} из {presentCount} учеников</span>
                    </div>
                )}

                <div className={styles.studentsSection}>
                    <h3 className={styles.sectionTitle}>Ученики</h3>
                    <p className={styles.sectionDescription}>
                        Отметьте учеников, которые присутствовали на занятии. Для присутствовавших можно отметить оплату.
                    </p>

                    <div className={styles.studentsList}>
                        {students.map(student => {
                            const record = attendanceRecords[student.id] || { attended: false, paid: false }
                            return (
                                <div
                                    key={student.id}
                                    className={`${styles.studentItem} ${record.attended ? styles.studentItemAttended : ''}`}
                                >
                                    <div className={styles.studentMain}>
                                        <Checkbox
                                            checked={record.attended}
                                            onChange={() => handleToggleAttendance(student.id)}
                                            label={student.name}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    {record.attended && price && price > 0 && (
                                        <div className={styles.studentPayment}>
                                            <Checkbox
                                                checked={record.paid}
                                                onChange={() => handleTogglePayment(student.id)}
                                                label="Оплатил(а)"
                                                disabled={isSubmitting || !record.attended}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    )
}