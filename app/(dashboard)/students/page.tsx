'use client'

import React from 'react'
import { PlusIcon } from '@/components/icons/Icons'
import { Button } from '@/components/ui/Button'
import { StudentsList } from '@/components/students/StudentsList'
import { StudentFilters } from '@/components/students/StudentFilters'
import { CreateStudentModal } from '@/components/students/CreateStudentModal'
import { EmptyStudentsState } from '@/components/students/EmptyStudentsState'
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

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Ученики</h1>
                    <p className={styles.subtitle}>Управляйте списком ваших учеников</p>
                </div>
                <Button onClick={handleOpenModal}>
                    <PlusIcon size={20} />
                    Добавить ученика
                </Button>
            </div>

            <StudentFilters
                subjects={subjects}
                students={students}
                selectedSubjectFilter={selectedSubjectFilter}
                onSelectFilter={setSelectedSubjectFilter}
            />

            {students.length === 0 ? (
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