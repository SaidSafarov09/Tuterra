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

export default function StudentsPage() {
    const {
        students,
        subjects,
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

            {!isLoading && (
                <StudentFilters
                    subjects={subjects}
                    students={students}
                    selectedSubjectFilter={selectedSubjectFilter}
                    onSelectFilter={setSelectedSubjectFilter}
                />
            )}

            {isLoading ? (
                <div className={styles.studentsGrid}>
                    <StudentCardSkeleton />
                    <StudentCardSkeleton />
                    <StudentCardSkeleton />
                    <StudentCardSkeleton />
                    <StudentCardSkeleton />
                    <StudentCardSkeleton />
                </div>
            ) : students.length === 0 ? (
                <EmptyStudentsState onAddStudent={handleOpenModal} />
            ) : (
                <StudentsList students={filteredStudents} />
            )}

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
                onCreateSubject={handleCreateSubject}
            />
        </div>
    )
}