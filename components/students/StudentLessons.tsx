import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatSmartDate } from '@/lib/dateUtils'
import { Student } from '@/types'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'

interface StudentLessonsProps {
    student: Student
    onCreateLesson: () => void
}

export function StudentLessons({ student, onCreateLesson }: StudentLessonsProps) {
    const router = useRouter()

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Занятия ({student._count?.lessons || 0})</h3>
            </div>

            {student.lessons && student.lessons.length > 0 ? (
                <div className={styles.lessonsList}>
                    {student.lessons?.map((lesson) => (
                        <div
                            key={lesson.id}
                            className={styles.lessonItem}
                            onClick={() => router.push(`/lessons/${lesson.id}`)}
                        >
                            <div className={styles.lessonDate}>
                                {formatSmartDate(lesson.date)}
                            </div>
                            <div className={styles.lessonInfo}>
                                <span className={styles.lessonPrice}>{lesson.price} ₽</span>
                                <span
                                    className={`${styles.badge} ${lesson.isPaid ? styles.badgePaid : styles.badgeUnpaid
                                        }`}
                                >
                                    {lesson.isPaid ? 'Оплачено' : 'Не оплачено'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyLessons}>
                    <p className={styles.emptyText}>Нет занятий</p>
                    <Button size="small" onClick={onCreateLesson}>
                        Создать
                    </Button>
                </div>
            )}
        </div>
    )
}
