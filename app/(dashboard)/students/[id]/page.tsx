'use client'

import React, { useEffect, useState, use as usePromise } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import styles from './page.module.scss'

interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
}

interface Student {
    id: string
    name: string
    contact?: string | null
    note?: string | null
    lessons: Lesson[]
    _count: {
        lessons: number
    }
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()

    // ⬅️ Правильное разворачивание params
    const { id } = usePromise(params)

    const [student, setStudent] = useState<Student | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        fetchStudent()
    }, [id])

    const fetchStudent = async () => {
        try {
            const response = await fetch(`/api/students/${id}`)
            if (response.ok) {
                const data = await response.json()
                setStudent(data)
            } else {
                toast.error('Ученик не найден')
                router.push('/students')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке ученика')
            router.push('/students')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Вы уверены, что хотите удалить этого ученика? Все занятия также будут удалены.')) {
            return
        }

        try {
            const response = await fetch(`/api/students/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('Ученик успешно удален')
                router.push('/students')
            } else {
                toast.error('Произошла ошибка при удалении')
            }
        } catch (error) {
            toast.error('Произошла ошибка при удалении')
        }
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    if (!student) {
        return null
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const stringToColor = (str: string): string => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        const hue = Math.abs(hash % 360)
        return `hsl(${hue}, 65%, 55%)`
    }

    return (
        <div>
            <div className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()}>
                    ← Назад
                </Button>
            </div>

            <div className={styles.studentHeader}>
                <div
                    className={styles.studentAvatar}
                    style={{ backgroundColor: stringToColor(student.name) }}
                >
                    {getInitials(student.name)}
                </div>
                <div className={styles.studentInfo}>
                    <h1 className={styles.studentName}>{student.name}</h1>
                    {student.contact && (
                        <p className={styles.studentContact}>{student.contact}</p>
                    )}
                </div>
                <div className={styles.actions}>
                    <Button variant="danger" onClick={handleDelete}>
                        Удалить
                    </Button>
                </div>
            </div>

            {student.note && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Заметка</h3>
                    <p className={styles.note}>{student.note}</p>
                </div>
            )}

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Занятия ({student._count.lessons})</h3>
                </div>

                {student.lessons.length > 0 ? (
                    <div className={styles.lessonsList}>
                        {student.lessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className={styles.lessonItem}
                                onClick={() => router.push(`/lessons/${lesson.id}`)}
                            >
                                <div className={styles.lessonDate}>
                                    {format(new Date(lesson.date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
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
                    <div className={styles.emptyState}>Нет занятий</div>
                )}
            </div>
        </div>
    )
}