import React from 'react'
import { UsersGroupIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import styles from '../../app/(dashboard)/students/page.module.scss'

interface EmptyStudentsStateProps {
    onAddStudent: () => void
}

export function EmptyStudentsState({ onAddStudent }: EmptyStudentsStateProps) {
    return (
        <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}><UsersGroupIcon size={64} color="#9CA3AF" /></div>
            <h2 className={styles.emptyStateTitle}>Нет учеников</h2>
            <p className={styles.emptyStateText}>
                Добавьте первого ученика, чтобы начать работу
            </p>
            <Button onClick={onAddStudent}>Добавить ученика</Button>
        </div>
    )
}
