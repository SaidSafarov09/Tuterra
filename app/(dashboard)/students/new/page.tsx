'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { StudentForm } from '@/components/students/StudentForm'
import { useStudents } from '@/hooks/useStudents'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { Tabs } from '@/components/ui/Tabs'
import { Dropdown } from '@/components/ui/Dropdown'
import { linkStudentToSubject } from '@/services/actions'
import { toast } from 'sonner'
import styles from './page.module.scss'

export default function NewStudentPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const subjectIdParam = searchParams.get('subjectId')

    const [mode, setMode] = useState<'create' | 'link'>('create')
    const [selectedStudentId, setSelectedStudentId] = useState('')
    const [isLinking, setIsLinking] = useState(false)

    const {
        isSubmitting,
        error,
        formData,
        setFormData,
        handleChange,
        subjects,
        students,
        handleCreateSubject,
        handleSubmit,
        isLoading
    } = useStudents(() => {
        router.back()
    })

    useEffect(() => {
        if (subjectIdParam) {
            setFormData(prev => ({ ...prev, subjectId: subjectIdParam }))
            setMode('link')
        }
    }, [subjectIdParam, setFormData])

    const handleLinkSubmit = async () => {
        if (!selectedStudentId || !subjectIdParam) return

        setIsLinking(true)
        try {
            const success = await linkStudentToSubject(subjectIdParam, selectedStudentId)
            if (success) {
                toast.success('Ученик добавлен к предмету')
                router.back()
            } else {
                toast.error('Ошибка при добавлении ученика')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        } finally {
            setIsLinking(false)
        }
    }

    const availableStudents = students.filter(
        s => !s.subjects.some(subj => subj.id === subjectIdParam)
    )

    const subject = subjects.find(s => s.id === subjectIdParam)

    let title = 'Добавить ученика'
    if (isLoading && subjectIdParam) {
        title = 'Загрузка...'
    } else if (subject) {
        title = `Добавить ученика в предмет ${subject.name}`
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

            {subjectIdParam && (
                <div style={{ marginBottom: '24px' }}>
                    <Tabs
                        tabs={[
                            { id: 'link', label: 'Добавить' },
                            { id: 'create', label: 'Создать нового' }
                        ]}
                        activeTab={mode}
                        onChange={(id) => setMode(id as 'create' | 'link')}
                    />
                </div>
            )}

            {mode === 'link' && subjectIdParam ? (
                <div className={styles.form}>
                    <Dropdown
                        label="Выберите ученика"
                        placeholder="Выберите ученика"
                        value={selectedStudentId}
                        onChange={setSelectedStudentId}
                        placeholderSearch="Найти ученика"
                        options={availableStudents.map((student) => ({
                            value: student.id,
                            label: student.name,
                        }))}
                        searchable
                        required
                    />
                    <div className={styles.formActions}>
                        <Button
                            onClick={handleLinkSubmit}
                            fullWidth
                            disabled={!selectedStudentId || isLinking}
                            isLoading={isLinking}
                        >
                            Добавить
                        </Button>
                    </div>
                </div>
            ) : (
                <StudentForm
                    isSubmitting={isSubmitting}
                    error={error}
                    formData={formData}
                    setFormData={setFormData}
                    handleChange={handleChange}
                    subjects={subjects}
                    onCreateSubject={handleCreateSubject}
                    onSubmit={handleSubmit}
                    fixedSubjectId={subjectIdParam || undefined}
                >
                    <div className={styles.formActions}>
                        <Button
                            type="submit"
                            fullWidth
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Добавление...' : 'Добавить'}
                        </Button>
                    </div>
                </StudentForm>
            )}
        </div>
    )
}
