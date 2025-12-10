import React from 'react'
import { Button } from '@/components/ui/Button'
import { PlusIcon, UsersGroupIcon } from '@/components/icons/Icons'
import styles from '../../app/(dashboard)/groups/page.module.scss'

interface EmptyGroupsStateProps {
    onAddGroup: () => void
}

export function EmptyGroupsState({ onAddGroup }: EmptyGroupsStateProps) {
    return (
        <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
                <UsersGroupIcon size={48} />
            </div>
            <h3 className={styles.emptyStateTitle}>У вас пока нет групп</h3>
            <p className={styles.emptyStateText}>
                Создайте первую группу, чтобы начать вести занятия
            </p>
            <Button onClick={onAddGroup}>
                <PlusIcon size={20} />
                Создать группу
            </Button>
        </div>
    )
}
