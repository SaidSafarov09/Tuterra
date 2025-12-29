'use client'

import React from 'react'
import { useAuthStore } from '@/store/auth'
import { GroupsList } from '@/components/groups/GroupsList'
import { StudentCardSkeleton } from '@/components/skeletons'
import { useGroups } from '@/hooks/useGroups'
import styles from './page.module.scss'
import { GroupFilters } from '@/components/groups/GroupFilters'
import { AnimatePresence, motion } from 'framer-motion'
import { PageHeader } from '@/components/ui/PageHeader'
import { UsersGroupIcon } from '@/components/icons/Icons'
import { EmptyState } from '@/components/ui/EmptyState'

export default function StudentGroupsPage() {
    const { user } = useAuthStore()
    const {
        groups,
        subjects,
        isLoading,
        selectedSubjectFilter,
        setSelectedSubjectFilter,
        filteredGroups
    } = useGroups(undefined, true)

    return (
        <div className={styles.container}>
            <PageHeader
                title="Мои группы"
                subtitle="Групповые занятия, в которых вы участвуете"
            />

            {!isLoading && groups.length > 0 && (
                <div className={styles.filters}>
                    <GroupFilters
                        subjects={subjects}
                        groups={groups}
                        selectedSubjectFilter={selectedSubjectFilter}
                        onSelectFilter={setSelectedSubjectFilter}
                    />
                </div>
            )}

            <div className={styles.content}>
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={styles.grid}
                        >
                            <StudentCardSkeleton />
                            <StudentCardSkeleton />
                            <StudentCardSkeleton />
                        </motion.div>
                    ) : groups.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <EmptyState
                                title="Вы пока не состоите в группах"
                                description="Когда преподаватель добавит вас в группу, она появится здесь"
                                icon={<UsersGroupIcon size={48} color="var(--primary)" />}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedSubjectFilter}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <GroupsList groups={filteredGroups} isStudentView />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
