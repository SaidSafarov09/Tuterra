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

            {isLoading ? (
                <div className={styles.groupsGrid}>
                    <StudentCardSkeleton />
                    <StudentCardSkeleton />
                    <StudentCardSkeleton />
                </div>
            ) : groups.length === 0 ? (
                <EmptyGroupsState onAddGroup={handleOpenModal} />
            ) : (
                <GroupsList groups={filteredGroups} />
            )}

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
