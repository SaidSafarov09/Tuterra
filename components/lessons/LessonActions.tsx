import React, { useState, useRef, useEffect } from 'react'
import { isLessonPast } from '@/lib/lessonTimeUtils'
import { CheckIcon, XCircleIcon, EditIcon, DeleteIcon, RescheduleIcon, MoreVerticalIcon } from '@/components/icons/Icons'
import { Lesson } from '@/types'
import { isTrial } from '@/lib/lessonUtils'
import styles from './LessonActions.module.scss'

interface LessonActionsProps {
    lesson: Lesson
    onTogglePaid: (lesson: Lesson) => void
    onToggleCancel?: (lesson: Lesson) => void
    onEdit: (lesson: Lesson) => void
    onDelete: (lessonId: string) => void
    onReschedule?: (lesson: Lesson) => void
    showCancelButton?: boolean
    disableMobileDropdown?: boolean
    index?: number
    totalItems?: number
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
    totalItems = 0
}: LessonActionsProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const isLessonEnded = isLessonPast(lesson.date, lesson.duration || 60)
    const isTrialLesson = isTrial(lesson.price)

    const isLastItem = totalItems > 0 && index === totalItems - 1
    const dropdownPosition = isLastItem ? 'top' : 'bottom'

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

    const showMobileDropdown = isMobile && !disableMobileDropdown

    const handleAction = (action: () => void) => {
        action()
        setIsDropdownOpen(false)
    }

    const handleDropdownToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsDropdownOpen(!isDropdownOpen)
    }

    if (showMobileDropdown) {
        return (
            <div className={styles.lessonActions} onClick={(e) => isDropdownOpen && e.stopPropagation()}>
                {!isTrialLesson && (
                    <button
                        className={`${styles.actionButton} ${styles.paidButton} ${lesson.isPaid ? styles.isPaid : ''}`}
                        onClick={() => onTogglePaid(lesson)}
                        disabled={lesson.isCanceled}
                    >
                        <CheckIcon size={16} />
                        {lesson.isPaid ? 'Оплачено' : 'Оплатить'}
                    </button>
                )}

                {lesson.isCanceled && showCancelButton && !isLessonEnded && onToggleCancel && (
                    <button
                        className={`${styles.actionButton} ${styles.restoreButton}`}
                        onClick={() => onToggleCancel(lesson)}
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
                            {!lesson.isCanceled && showCancelButton && !isLessonEnded && onToggleCancel && (
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => handleAction(() => onToggleCancel(lesson))}
                                >
                                    <XCircleIcon size={16} />
                                    Отменить
                                </button>
                            )}

                            {!isLessonEnded && onReschedule && (
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => handleAction(() => onReschedule(lesson))}
                                >
                                    <RescheduleIcon size={16} />
                                    Перенести
                                </button>
                            )}

                            <button
                                className={styles.dropdownItem}
                                onClick={() => handleAction(() => onEdit(lesson))}
                                disabled={isLessonEnded}
                            >
                                <EditIcon size={16} />
                                Изменить
                            </button>

                            <button
                                className={`${styles.dropdownItem} ${styles.deleteItem}`}
                                onClick={() => handleAction(() => onDelete(lesson.id))}
                            >
                                <DeleteIcon size={16} />
                                Удалить
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={styles.lessonActions}>
            {!isTrialLesson && (
                <button
                    className={`${styles.actionButton} ${styles.paidButton} ${lesson.isPaid ? styles.isPaid : ''}`}
                    onClick={() => onTogglePaid(lesson)}
                    disabled={lesson.isCanceled}
                >
                    <CheckIcon size={16} />
                    {lesson.isPaid ? 'Оплачено' : 'Оплатить'}
                </button>
            )}

            {showCancelButton && !isLessonEnded && onToggleCancel && (
                <button
                    className={`${styles.actionButton} ${lesson.isCanceled ? styles.restoreButton : styles.cancelButton}`}
                    onClick={() => onToggleCancel(lesson)}
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

            {!isLessonEnded && onReschedule && (
                <button
                    className={`${styles.actionButton} ${styles.rescheduleButton}`}
                    onClick={() => onReschedule(lesson)}
                >
                    <RescheduleIcon size={16} />
                    Перенести
                </button>
            )}

            <button
                className={`${styles.actionButton} ${styles.editButton}`}
                onClick={() => onEdit(lesson)}
                disabled={isLessonEnded}
            >
                <EditIcon size={16} />
                Изменить
            </button>
            <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => onDelete(lesson.id)}
            >
                <DeleteIcon size={16} />
                Удалить
            </button>
        </div>
    )
}
