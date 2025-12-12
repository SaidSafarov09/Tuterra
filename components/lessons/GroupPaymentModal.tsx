'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Checkbox } from '@/components/ui/Checkbox'
import styles from './GroupPaymentModal.module.scss'

interface GroupPaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (paidStudentIds: string[], attendedStudentIds: string[]) => void
    students: { id: string; name: string }[]
    initialPaidStudentIds: string[]
    isSubmitting: boolean
    price?: number
    lessonDate?: Date | string // Добавляем дату урока для отображения
}

export function GroupPaymentModal({
    isOpen,
    onClose,
    onSubmit,
    students,
    initialPaidStudentIds,
    isSubmitting,
    price,
    lessonDate
}: GroupPaymentModalProps) {
    // Для отслеживания посещаемости и оплаты будем использовать отдельные состояния
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { attended: boolean, paid: boolean }>>({});

    const prevIsOpenRef = useRef<boolean>(false)

    useEffect(() => {
        const prev = prevIsOpenRef.current
        if (!prev && isOpen) {
            // Инициализируем состояние посещаемости и оплаты для всех студентов
            const initialRecords: Record<string, { attended: boolean, paid: boolean }> = {};
            
            // Сначала добавляем всех студентов как не посетивших и не оплативших
            students.forEach(student => {
                initialRecords[student.id] = { attended: false, paid: false };
            });
            
            // Затем помечаем оплативших студентов как оплативших и посетивших
            initialPaidStudentIds.forEach(studentId => {
                if (initialRecords[studentId]) {
                    initialRecords[studentId] = { attended: true, paid: true };
                } else {
                    initialRecords[studentId] = { attended: true, paid: true };
                }
            });
            
            setAttendanceRecords(initialRecords);
        }
        prevIsOpenRef.current = isOpen
    }, [isOpen, students, initialPaidStudentIds])
    
    // Обновляем функцию переключения для учета посещаемости и оплаты отдельно
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
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                paid: !prev[studentId]?.paid
            }
        }))
    }
    
    // При отправке формы отправляем ID студентов, которые оплатили, и ID студентов, которые присутствовали
    const handleSubmit = () => {
        const paidStudentIds = Object.entries(attendanceRecords)
            .filter(([_, record]) => record.paid)
            .map(([studentId, _]) => studentId)
            
        const attendedStudentIds = Object.entries(attendanceRecords)
            .filter(([_, record]) => record.attended)
            .map(([studentId, _]) => studentId)
            
        onSubmit(paidStudentIds, attendedStudentIds)
    }
    
    // Подсчитываем количество присутствовавших и оплативших
    const presentCount = Object.values(attendanceRecords).filter(record => record.attended).length
    const paidCount = Object.values(attendanceRecords).filter(record => record.paid).length
    const totalCount = students.length
    const amountDue = paidCount * (price || 0)
    
    // Определяем статус оплаты занятия
    const allAttendedPaid = presentCount > 0 && presentCount === paidCount
    const someAttendedPaid = presentCount > 0 && paidCount > 0 && paidCount < presentCount

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Управление оплатой и посещаемостью"
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
                    <p className={styles.date}>
                        Занятие: <strong>{typeof lessonDate === 'string'
                            ? new Date(lessonDate).toLocaleString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })
                            : (lessonDate as Date).toLocaleString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })
                        }</strong>
                    </p>
                )}
                
                <p className={styles.description}>
                    Отметьте учеников, которые присутствовали на занятии и/или оплатили его:
                </p>
                
                {price && price > 0 && (
                    <div className={styles.paymentInfo}>
                        <p className={styles.price}>
                            Цена за ученика: <strong>{price} ₽</strong>
                        </p>
                        <p className={styles.total}>
                            Присутствовали: <strong>{presentCount} из {totalCount} учеников</strong>
                        </p>
                        <p className={styles.amount}>
                            Сумма: <strong>{amountDue} ₽</strong>
                        </p>
                    </div>
                )}
                
                <p className={styles.hint}>
                    Ученики в списке уже включены в это занятие. Отметьте галочкой тех, кто присутствовал.
                </p>
                
                <div className={styles.studentsList}>
                    {students.map(student => {
                        const record = attendanceRecords[student.id] || { attended: false, paid: false }
                        return (
                            <div key={student.id} className={styles.studentItem}>
                                <Checkbox
                                    checked={record.attended}
                                    onChange={() => handleToggleAttendance(student.id)}
                                    label={student.name}
                                    disabled={isSubmitting}
                                />
                                {price && price > 0 && (
                                    <Checkbox
                                        checked={record.paid}
                                        onChange={() => handleTogglePayment(student.id)}
                                        label="Оплатил(а)"
                                        disabled={isSubmitting}
                                        className={styles.paymentCheckbox}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </Modal>
    )
}