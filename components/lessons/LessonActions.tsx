import React, { useState, useRef, useEffect } from 'react'
import { isLessonPast } from '@/lib/lessonTimeUtils'
import { CheckIcon, XCircleIcon, EditIcon, DeleteIcon, RescheduleIcon, MoreVerticalIcon } from '@/components/icons/Icons'
import { Lesson } from '@/types'
import { isTrial, isGroupLesson, isFullyPaidLesson, getLessonPaymentStatus } from '@/lib/lessonUtils'
import styles from './LessonActions.module.scss'

interface LessonActionsProps {
    lesson: Lesson
    onTogglePaid: (lesson: Lesson) => void
    onToggleCancel?: (lesson: Lesson) => void
    onEdit?: (lesson: Lesson) => void
    onDelete?: (lessonId: string) => void
    onReschedule?: (lesson: Lesson) => void
    showCancelButton?: boolean
    disableMobileDropdown?: boolean
    index?: number
    totalItems?: number
    isStudentView?: boolean
    isLoading?: boolean
    isLocked?: boolean
    onLockedAction?: (message: string) => void
}

export function LessonActions({
    lesson,
    onTogglePaid,
    onToggleCancel,
    onEdit,
    onDelete,
    onReschedule,
    showCancelButton = true,
    disableMobileDropdown = false,
    index = 0,
    totalItems = 0,
    isStudentView = false,
    isLoading = false,
    isLocked,
    onLockedAction,
}: LessonActionsProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const isLessonEnded = isLessonPast(lesson.date, lesson.duration || 60)
    const isTrialLesson = isTrial(lesson.price)

    const isLastItem = totalItems > 0 && index === totalItems - 1
    const dropdownPosition = isLastItem ? 'top' : 'bottom'

    // Student specific payment status
    const studentHasPaid = isStudentView
        ? (lesson.userHasPaid ?? (lesson.group
            ? !!lesson.lessonPayments?.find(p => p.hasPaid)
            : lesson.isPaid))
        : lesson.isPaid

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isDropdownOpen])

    const canCancel = !lesson.isCanceled && showCancelButton && !isLessonEnded && onToggleCancel && (!isStudentView || !isGroupLesson(lesson))
    const canReschedule = !isLessonEnded && onReschedule && (!isStudentView || !isGroupLesson(lesson))
    const canEdit = onEdit && !isStudentView
    const canDelete = onDelete && !isStudentView

    const hasAvailableActions = canCancel || canReschedule || canEdit || canDelete
    const showMobileDropdown = isMobile && !disableMobileDropdown && hasAvailableActions

    const handleAction = (action: () => void) => {
        action()
        setIsDropdownOpen(false)
    }

    const handleLockedWrapper = (action: () => void, message: string) => {
        if (isLocked && onLockedAction && !isStudentView) {
            onLockedAction(message)
            return
        }
        action()
    }

    const handleDropdownToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsDropdownOpen(!isDropdownOpen)
    }

    if (showMobileDropdown) {
        return (
            <div className={styles.lessonActions} onClick={(e) => isDropdownOpen && e.stopPropagation()}>
                {!isTrialLesson && !isStudentView && (
                    <button
                        className={`${styles.actionButton} ${styles.paidButton} ${getLessonPaymentStatus(lesson) === 'paid' ? styles.isPaid : getLessonPaymentStatus(lesson) === 'partial' ? styles.isPartial : getLessonPaymentStatus(lesson) === 'unpaid' ? styles.isUnpaid : ''}`}
                        onClick={() => handleLockedWrapper(() => onTogglePaid(lesson), 'Для управления финансами этого ученика необходимо продлить подписку.')}
                        disabled={lesson.isCanceled}
                    >
                        {isGroupLesson(lesson) ? (isFullyPaidLesson(lesson) ? <CheckIcon size={16} /> : null) : <CheckIcon size={16} />}
                        {isGroupLesson(lesson) ? (isFullyPaidLesson(lesson) ? 'Оплачено' : 'Управлять') : (lesson.isPaid ? 'Оплачено' : 'Оплатить')}
                    </button>
                )}

                {!isTrialLesson && isStudentView && (
                    <button
                        className={`${styles.actionButton} ${styles.paidButton} ${studentHasPaid ? styles.isPaid : styles.isUnpaid}`}
                        onClick={() => onTogglePaid(lesson)}
                        disabled={lesson.isCanceled || studentHasPaid || isLoading}
                    >
                        <CheckIcon size={16} />
                        {studentHasPaid ? 'Оплачено' : 'Я оплатил'}
                    </button>
                )}

                {lesson.isCanceled && showCancelButton && !isLessonEnded && onToggleCancel && (
                    <button
                        className={`${styles.actionButton} ${styles.restoreButton}`}
                        onClick={() => handleLockedWrapper(() => onToggleCancel(lesson), 'Для восстановления уроков этого ученика необходимо продлить подписку.')}
                    >
                        <CheckIcon size={16} />
                        Восстановить
                    </button>
                )}

                <div className={styles.dropdownContainer} ref={dropdownRef}>
                    <button
                        className={`${styles.actionButton} ${styles.moreButton}`}
                        onClick={handleDropdownToggle}
                    >
                        <MoreVerticalIcon size={16} />
                        Действия
                    </button>

                    {isDropdownOpen && (
                        <div className={`${styles.dropdownMenu} ${dropdownPosition === 'top' ? styles.dropdownTop : ''}`}>
                            {canCancel && (
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => handleLockedWrapper(() => handleAction(() => onToggleCancel!(lesson)), 'Для отмены уроков этого ученика необходимо продлить подписку.')}
                                >
                                    <XCircleIcon size={16} />
                                    Отменить
                                </button>
                            )}

                            {canReschedule && (
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => handleLockedWrapper(() => handleAction(() => onReschedule(lesson)), 'Для переноса уроков этого ученика необходимо продлить подписку.')}
                                >
                                    <RescheduleIcon size={16} />
                                    Перенести
                                </button>
                            )}

                            {canEdit && (
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => handleLockedWrapper(() => handleAction(() => onEdit(lesson)), 'Для редактирования уроков этого ученика необходимо продлить подписку.')}
                                    disabled={isLessonEnded}
                                >
                                    <EditIcon size={16} />
                                    Изменить
                                </button>
                            )}

                            {canDelete && (
                                <button
                                    className={`${styles.dropdownItem} ${styles.deleteItem}`}
                                    onClick={() => handleLockedWrapper(() => handleAction(() => onDelete(lesson.id)), 'Для удаления уроков этого ученика необходимо продлить подписку.')}
                                >
                                    <DeleteIcon size={16} />
                                    Удалить
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={styles.lessonActions}>
            {!isTrialLesson && !isStudentView && (
                <button
                    className={`${styles.actionButton} ${styles.paidButton} ${getLessonPaymentStatus(lesson) === 'paid' ? styles.isPaid : getLessonPaymentStatus(lesson) === 'partial' ? styles.isPartial : getLessonPaymentStatus(lesson) === 'unpaid' ? styles.isUnpaid : ''}`}
                    onClick={() => handleLockedWrapper(() => onTogglePaid(lesson), 'Для управления финансами этого ученика необходимо продлить подписку.')}
                    disabled={lesson.isCanceled}
                >
                    {isGroupLesson(lesson) ? (isFullyPaidLesson(lesson) ? <CheckIcon size={16} /> : null) : <CheckIcon size={16} />}
                    {isGroupLesson(lesson) ? (isFullyPaidLesson(lesson) ? 'Оплачено' : 'Управлять') : (lesson.isPaid ? 'Оплачено' : 'Оплатить')}
                </button>
            )}

            {!isTrialLesson && isStudentView && (
                <button
                    className={`${styles.actionButton} ${styles.paidButton} ${studentHasPaid ? styles.isPaid : styles.isUnpaid}`}
                    onClick={() => onTogglePaid(lesson)}
                    disabled={lesson.isCanceled || studentHasPaid || isLoading}
                >
                    <CheckIcon size={16} />
                    {studentHasPaid ? 'Оплачено' : 'Я оплатил'}
                </button>
            )}

            {showCancelButton && !isLessonEnded && onToggleCancel && (!isStudentView || !isGroupLesson(lesson)) && (
                <button
                    className={`${styles.actionButton} ${lesson.isCanceled ? styles.restoreButton : styles.cancelButton}`}
                    onClick={() => handleLockedWrapper(() => onToggleCancel(lesson), lesson.isCanceled ? 'Для восстановления уроков этого ученика необходимо продлить подписку.' : 'Для отмены уроков этого ученика необходимо продлить подписку.')}
                >
                    {lesson.isCanceled ? (
                        <>
                            <CheckIcon size={16} />
                            Восстановить
                        </>
                    ) : (
                        <>
                            <XCircleIcon size={16} />
                            Отменить
                        </>
                    )}
                </button>
            )}

            {!isLessonEnded && onReschedule && (!isStudentView || !isGroupLesson(lesson)) && (
                <button
                    className={`${styles.actionButton} ${styles.rescheduleButton}`}
                    onClick={() => handleLockedWrapper(() => onReschedule(lesson), 'Для переноса уроков этого ученика необходимо продлить подписку.')}
                >
                    <RescheduleIcon size={16} />
                    Перенести
                </button>
            )}

            {onEdit && !isStudentView && (
                <button
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleLockedWrapper(() => onEdit(lesson), 'Для редактирования уроков этого ученика необходимо продлить подписку.')}
                    disabled={isLessonEnded}
                >
                    <EditIcon size={16} />
                    Изменить
                </button>
            )}
            {onDelete && !isStudentView && (
                <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleLockedWrapper(() => onDelete(lesson.id), 'Для удаления уроков этого ученика необходимо продлить подписку.')}
                >
                    <DeleteIcon size={16} />
                    Удалить
                </button>
            )}
        </div>
    )
}
