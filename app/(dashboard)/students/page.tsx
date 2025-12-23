'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { PlusIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { StudentsList } from '@/components/students/StudentsList'
import { StudentFilters } from '@/components/students/StudentFilters'
import { CreateStudentModal } from '@/components/students/CreateStudentModal'
import { EmptyStudentsState } from '@/components/students/EmptyStudentsState'
import { StudentCardSkeleton } from '@/components/skeletons'
import { useStudents } from '@/hooks/useStudents'
import styles from './page.module.scss'
import { AnimatePresence, motion } from 'framer-motion'

export default function StudentsPage() {
    const {
        students,
        subjects,
        groups,
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
        handleCreateSubject,
        handleSubmit,
        filteredStudents
    } = useStudents()

    const router = useRouter()
    const isMobile = useMediaQuery('(max-width: 768px)')

    const handleAddClick = () => {
        handleOpenModal()
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Ученики</h1>
                    <p className={styles.subtitle}>Управляйте списком ваших учеников</p>
                </div>
                <Button onClick={handleAddClick}>
                    <PlusIcon size={20} />
                    Добавить ученика
                </Button>
            </div>

            {!isLoading && students.length > 0 && (
                <StudentFilters
                    subjects={subjects}
                    students={students}
                    selectedSubjectFilter={selectedSubjectFilter}
                    onSelectFilter={setSelectedSubjectFilter}
                />
            )}

            <div data-onboarding="students-list" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={styles.studentsGrid}
                        >
                            <StudentCardSkeleton />
                            <StudentCardSkeleton />
                            <StudentCardSkeleton />
                            <StudentCardSkeleton />
                            <StudentCardSkeleton />
                            <StudentCardSkeleton />
                        </motion.div>
                    ) : students.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <EmptyStudentsState onAddStudent={handleOpenModal} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedSubjectFilter}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StudentsList students={filteredStudents} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <CreateStudentModal
                isOpen={isOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={error}
                formData={formData}
                setFormData={setFormData}
                handleChange={handleChange}
                subjects={subjects}
                groups={groups}
                onCreateSubject={handleCreateSubject}
            />
        </div>
    )
}