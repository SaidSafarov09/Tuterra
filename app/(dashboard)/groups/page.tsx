'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { PlusIcon, UsersIcon } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { Group } from '@/types'
import { GroupCard } from '@/components/groups/GroupCard'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { EmptyGroupsState } from '@/components/groups/EmptyGroupsState'
import { GroupCardSkeleton } from '@/components/skeletons'
import styles from './page.module.scss'

export default function GroupsPage() {
    const router = useRouter()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const { data: groups, isLoading, refetch } = useFetch<Group[]>('/api/groups')

    const handleGroupClick = (groupId: string) => {
        router.push(`/groups/${groupId}`)
    }

    const handleCreateSuccess = () => {
        setIsCreateModalOpen(false)
        refetch()
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Группы</h1>
                    <p className={styles.subtitle}>Управляйте группами учеников</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusIcon size={20} />
                    Создать группу
                </Button>
            </div>

            {isLoading ? (
                <div className={styles.groupsGrid}>
                    <GroupCardSkeleton />
                    <GroupCardSkeleton />
                    <GroupCardSkeleton />
                    <GroupCardSkeleton />
                </div>
            ) : !groups || groups.length === 0 ? (
                <EmptyGroupsState onCreateGroup={() => setIsCreateModalOpen(true)} />
            ) : (
                <div className={styles.groupsGrid}>
                    {groups.map(group => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            onClick={() => handleGroupClick(group.id)}
                        />
                    ))}
                </div>
            )}

            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    )
}
