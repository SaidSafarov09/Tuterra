'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { PlusIcon, UsersGroupIcon } from '@/components/icons/Icons'
import { TeacherLinkModal } from '@/components/students/TeacherLinkModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { StudentCardSkeleton } from '@/components/skeletons'
import { toast } from 'sonner'
import styles from './page.module.scss'
import { useAuthStore } from '@/store/auth'
import * as Avatar from '@radix-ui/react-avatar'
import { getInitials, stringToColor } from '@/constants'

interface Teacher {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    avatar: string | null
}

export default function StudentTeachersPage() {
    const { user } = useAuthStore()
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)

    const fetchTeachers = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/student/teachers')
            const data = await response.json()
            if (data.success) {
                setTeachers(data.teachers)
            }
        } catch (error) {
            toast.error('Не удалось загрузить список репетиторов')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTeachers()
    }, [])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Мои репетиторы</h1>
                    <p className={styles.subtitle}>Список преподавателей, к которым вы подключены</p>
                </div>
                <Button onClick={() => setIsLinkModalOpen(true)}>
                    <PlusIcon size={20} />
                    Добавить репетитора
                </Button>
            </div>

            {isLoading ? (
                <div className={styles.grid}>
                    <StudentCardSkeleton />
                    <StudentCardSkeleton />
                    <StudentCardSkeleton />
                </div>
            ) : teachers.length === 0 ? (
                <EmptyState
                    title="У вас пока нет репетиторов"
                    description="Попросите у своего преподавателя код и введите его, чтобы подключиться к платформе"
                    icon={<UsersGroupIcon size={48} color="var(--primary)" />}
                    action={
                        <Button onClick={() => setIsLinkModalOpen(true)}>
                            Ввести код
                        </Button>
                    }
                />
            ) : (
                <div className={styles.grid}>
                    {teachers.map((teacher) => (
                        <div key={teacher.id} className={styles.teacherCard}>
                            <div className={styles.cardHeader}>
                                <Avatar.Root className={styles.avatar}>
                                    <Avatar.Image src={teacher.avatar || undefined} className={styles.avatarImage} />
                                    <Avatar.Fallback
                                        className={styles.avatarFallback}
                                        style={{ backgroundColor: stringToColor(teacher.name || 'T') }}
                                    >
                                        {getInitials(teacher.name)}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                                <div className={styles.teacherInfo}>
                                    <h3 className={styles.teacherName}>{teacher.name || 'Без имени'}</h3>
                                    <p className={styles.teacherContact}>{teacher.email || teacher.phone || 'Нет контактов'}</p>
                                </div>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.badge}>Подключён</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TeacherLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onLinkSuccess={fetchTeachers}
            />
        </div>
    )
}
