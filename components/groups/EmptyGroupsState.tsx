import React from 'react'
import { Button } from '@/components/ui/Button'
import { UsersIcon, PlusIcon } from 'lucide-react'
import styles from './EmptyGroupsState.module.scss'

interface EmptyGroupsStateProps {
    onCreateGroup: () => void
}

export const EmptyGroupsState: React.FC<EmptyGroupsStateProps> = ({ onCreateGroup }) => {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <UsersIcon size={48} />
            </div>
            <h3 className={styles.title}>Нет групп</h3>
            <p className={styles.description}>
                Создайте первую группу для организации групповых занятий
            </p>
            <Button onClick={onCreateGroup}>
                <PlusIcon size={20} />
                Создать группу
            </Button>
        </div>
    )
}
