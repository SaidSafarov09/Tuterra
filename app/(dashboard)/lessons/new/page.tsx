'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LessonForm } from '@/components/lessons/LessonForm'
import { useLessonForm } from '@/hooks/useLessonForm'
import { useFetch } from '@/hooks/useFetch'
import { Student, Subject } from '@/types'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import styles from './page.module.scss'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function NewLessonPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const dateParam = searchParams.get('date')
    const studentIdParam = searchParams.get('studentId')
    const subjectIdParam = searchParams.get('subjectId')

    const {
        data: students = [],
        isLoading: isStudentsLoading,
        refetch: refetchStudents
    } = useFetch<Student[]>('/api/students')

    const {
        data: subjects = [],
        isLoading: isSubjectsLoading,
        refetch: refetchSubjects
    } = useFetch<Subject[]>('/api/subjects')

    const {
        formData,
        setFormData,
        isSubmitting,
        error,
        handleChange,
        handleStudentChange,
        handleCreateStudent,
        handleCreateSubject,
        handleSubmit
    } = useLessonForm(
        () => {
            router.back()
        },
        refetchStudents,
        refetchSubjects
    )

    React.useEffect(() => {
        if (dateParam) {
            const date = new Date(dateParam)
            if (!isNaN(date.getTime())) {
                setFormData(prev => ({ ...prev, date }))
            }
        }
        if (studentIdParam) {
            setFormData(prev => ({ ...prev, studentId: studentIdParam }))
        }
        if (subjectIdParam) {
            setFormData(prev => ({ ...prev, subjectId: subjectIdParam }))
        }
    }, [dateParam, studentIdParam, subjectIdParam, setFormData])

    const student = students?.find(s => s.id === studentIdParam || s.slug === studentIdParam)
    const subject = subjects?.find(s => s.id === subjectIdParam)

    const isContextLoading = (studentIdParam && isStudentsLoading) || (subjectIdParam && isSubjectsLoading)

    let title = 'Добавить занятие'
    if (isContextLoading) {
        title = 'Загрузка...'
    } else if (student) {
        title = `Занятие для ученика ${student.name}`
    } else if (subject) {
        title = `Занятие по предмету ${subject.name}`
    } else if (dateParam) {
        const date = new Date(dateParam)
        if (!isNaN(date.getTime())) {
            title = `Занятие на ${format(date, 'd MMMM', { locale: ru })}`
        }
    }

    return (
        <div className={`${styles.container} page-enter-animation`}>
            <div className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()} className={styles.backButton}>
                    <ArrowLeft size={20} />
                    Назад
                </Button>
                <h1 className={styles.title}>{title}</h1>
            </div>

            <LessonForm
                isEdit={false}
                formData={formData}
                setFormData={setFormData}
                students={students || []}
                subjects={subjects || []}
                isSubmitting={isSubmitting}
                error={error}
                onSubmit={() => handleSubmit(false)}
                onStudentChange={handleStudentChange}
                onCreateStudent={handleCreateStudent}
                onCreateSubject={handleCreateSubject}
                handleChange={handleChange}
                fixedStudentId={student?.id || studentIdParam || undefined}
                fixedSubjectId={subjectIdParam || undefined}
            >
                <div className={styles.formActions}>
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isSubmitting}
                        onClick={() => handleSubmit(false)}
                    >
                        Добавить
                    </Button>
                </div>
            </LessonForm>
        </div>
    )
}
