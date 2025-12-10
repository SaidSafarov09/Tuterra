'use client'

import React, { use as usePromise, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, PlusIcon, EditIcon, TrashIcon, UsersIcon } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { Group, Student } from '@/types'
import { groupsApi } from '@/services/api'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EditGroupModal } from '@/components/groups/EditGroupModal'
import { ManageStudentsModal } from '@/components/groups/ManageStudentsModal'
import { GroupDetailSkeleton } from '@/components/skeletons/GroupDetailSkeleton'
import styles from './page.module.scss'

export default function GroupDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = usePromise(params)
    const router = useRouter()

    const { data: group, isLoading, refetch } = useFetch<Group>(`/api/groups/${id}`)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await groupsApi.delete(id)
            toast.success('Группа удалена')
            router.push('/groups')
        } catch (error) {
            toast.error('Не удалось удалить группу')
            setIsDeleting(false)
        }
    }

    const handleCreateLesson = () => {
        router.push(`/lessons/new?groupId=${id}`)
    }

    if (isLoading) {
        return <GroupDetailSkeleton />
    }

    if (!group) {
        return (
            <div className={styles.notFound}>
                <h2>Группа не найдена</h2>
                <Button onClick={() => router.push('/groups')}>
                    Вернуться к группам
                </Button>
            </div>
        )
    }

    const studentCount = group.students?.length || 0

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className={styles.backButton}
                >
                    <ArrowLeft size={20} />
                    Назад
                </Button>

                <div className={styles.actions}>
                    <Button
                        variant="secondary"
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <EditIcon size={18} />
                        Редактировать
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => setDeleteConfirm(true)}
                    >
                        <TrashIcon size={18} />
                        Удалить
                    </Button>
                </div>
            </div>

            <div className={styles.groupInfo}>
                <div className={styles.iconWrapper}>
                    <UsersIcon size={32} />
                </div>
                <div>
                    <h1 className={styles.groupName}>{group.name}</h1>
                    <p className={styles.groupMeta}>
                        {studentCount} {studentCount === 1 ? 'ученик' : studentCount < 5 ? 'ученика' : 'учеников'}
                    </p>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Участники</h2>
                    <Button
                        size="small"
                        onClick={() => setIsManageStudentsOpen(true)}
                    >
                        <PlusIcon size={16} />
                        Управление участниками
                    </Button>
                </div>

                {studentCount === 0 ? (
                    <div className={styles.emptyState}>
                        <p>В группе пока нет участников</p>
                        <Button
                            variant="secondary"
                            onClick={() => setIsManageStudentsOpen(true)}
                        >
                            Добавить участников
                        </Button>
                    </div>
                ) : (
                    <div className={styles.studentsList}>
                        {group.students.map(student => (
                            <div
                                key={student.id}
                                className={styles.studentCard}
                                onClick={() => router.push(`/students/${student.slug || student.id}`)}
                            >
                                <div className={styles.studentInfo}>
                                    <h3 className={styles.studentName}>{student.name}</h3>
                                    {student.contact && (
                                        <p className={styles.studentContact}>{student.contact}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Групповые занятия</h2>
                    <Button
                        size="small"
                        onClick={handleCreateLesson}
                    >
                        <PlusIcon size={16} />
                        Создать занятие
                    </Button>
                </div>

                <div className={styles.lessonsInfo}>
                    <p className={styles.lessonsCount}>
                        Всего занятий: {group._count?.lessons || 0}
                    </p>
                </div>
            </div>

            <EditGroupModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                group={group}
                onSuccess={() => {
                    setIsEditModalOpen(false)
                    refetch()
                }}
            />

            <ManageStudentsModal
                isOpen={isManageStudentsOpen}
                onClose={() => setIsManageStudentsOpen(false)}
                group={group}
                onSuccess={() => {
                    setIsManageStudentsOpen(false)
                    refetch()
                }}
            />

            <ConfirmDialog
                isOpen={deleteConfirm}
                onClose={() => setDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Удалить группу?"
                message="Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить."
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    )
}
