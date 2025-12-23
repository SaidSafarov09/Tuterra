'use client'

import React from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { PlusIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { GroupsList } from '@/components/groups/GroupsList'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { EmptyGroupsState } from '@/components/groups/EmptyGroupsState'
import { StudentCardSkeleton } from '@/components/skeletons'
import { useGroups } from '@/hooks/useGroups'
import styles from './page.module.scss'
import { GroupFilters } from '@/components/groups/GroupFilters'
import { AnimatePresence, motion } from 'framer-motion'

export default function GroupsPage() {
    const {
        groups,
        subjects,
        students,
        isLoading,
        isSubmitting,
        error,
        formData,
        setFormData,
        selectedSubjectFilter,
        setSelectedSubjectFilter,
        isOpen,
        handleOpenModal,
        handleCloseModal,
        handleChange,
        handleStudentSelection,
        handleCreateSubject,
        handleSubmit,
        filteredGroups
    } = useGroups()

    const isMobile = useMediaQuery('(max-width: 768px)')

    const handleAddClick = () => {
        handleOpenModal()
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Группы</h1>
                    <p className={styles.subtitle}>Управляйте списком ваших групп</p>
                </div>
                <Button onClick={handleAddClick}>
                    <PlusIcon size={20} />
                    Создать группу
                </Button>
            </div>

            {!isLoading && (
                <GroupFilters
                    subjects={subjects}
                    groups={groups}
                    selectedSubjectFilter={selectedSubjectFilter}
                    onSelectFilter={setSelectedSubjectFilter}
                />
            )}

            <div data-onboarding="groups-list" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={styles.groupsGrid}
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
                            <EmptyGroupsState onAddGroup={handleOpenModal} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedSubjectFilter}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <GroupsList groups={filteredGroups} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <CreateGroupModal
                isOpen={isOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={error}
                formData={formData}
                setFormData={setFormData}
                handleChange={handleChange}
                handleStudentSelection={handleStudentSelection}
                subjects={subjects}
                students={students}
                onCreateSubject={handleCreateSubject}
            />
        </div>
    )
}
