import React, { useState, useEffect } from 'react'
import { Student, Subject, Group, LessonFormData } from '@/types'
import { Tabs } from '@/components/ui/Tabs'
import { usePlanTopics } from '@/hooks/usePlanTopics'
import { LessonFormStudentSubject } from './form/LessonFormStudentSubject'
import { LessonFormDateTime } from './form/LessonFormDateTime'
import { LessonFormPriceDuration } from './form/LessonFormPriceDuration'
import { LessonFormTopic } from './form/LessonFormTopic'
import { LessonFormPayment } from './form/LessonFormPayment'
import styles from './form/LessonForm.module.scss'

export interface LessonFormProps {
    isEdit: boolean
    formData: LessonFormData
    setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>
    students: Student[]
    groups?: Group[]
    subjects: Subject[]
    isSubmitting: boolean
    error: string
    onSubmit: () => void
    onStudentChange: (studentId: string, students: Student[]) => void
    onGroupChange?: (groupId: string, groups: Group[]) => void
    onCreateStudent: (name: string) => void
    onCreateSubject: (name: string) => void
    handleChange: (name: string, value: any) => void
    fixedSubjectId?: string
    fixedStudentId?: string
    fixedGroupId?: string
    children?: React.ReactNode
}

export function LessonForm({
    isEdit,
    formData,
    setFormData,
    students,
    groups = [],
    subjects,
    isSubmitting,
    error,
    onCreateStudent,
    onCreateSubject,
    handleChange,
    onStudentChange,
    onGroupChange,
    fixedSubjectId,
    fixedStudentId,
    fixedGroupId,
    children
}: LessonFormProps) {
    const [activeTab, setActiveTab] = useState<'single' | 'recurring'>(
        formData.recurrence?.enabled ? 'recurring' : 'single'
    )

    const { planTopics } = usePlanTopics(
        formData.studentId,
        formData.groupId,
        formData.subjectId,
        activeTab === 'single'
    )

    useEffect(() => {
        if (fixedStudentId && formData.studentId !== fixedStudentId) {
            setFormData(prev => ({ ...prev, studentId: fixedStudentId }))
        }
    }, [fixedStudentId])

    useEffect(() => {
        if (fixedGroupId && formData.groupId !== fixedGroupId) {
            setFormData(prev => ({ ...prev, groupId: fixedGroupId, studentId: undefined }))
        }
    }, [fixedGroupId])

    const handleTabChange = (tabId: string) => {
        const nextTab = tabId as 'single' | 'recurring'
        setActiveTab(nextTab)
        if (nextTab === 'single') {
            handleChange('recurrence', undefined)
        } else {
            handleChange('recurrence', {
                enabled: true,
                type: 'weekly',
                interval: 1,
                daysOfWeek: [],
                endType: 'never',
            })
        }
    }

    const handleStudentOrGroupChange = (value: string) => {
        if (value.startsWith('group_')) {
            const groupId = value.replace('group_', '')
            if (onGroupChange) {
                onGroupChange(groupId, groups)
            } else {
                const group = groups.find(g => g.id === groupId)
                if (group) {
                    setFormData(prev => ({
                        ...prev,
                        groupId: group.id,
                        studentId: undefined,
                        subjectId: group.subjectId,
                        paidStudentIds: []
                    }))
                }
            }
        } else {
            setFormData(prev => ({
                ...prev,
                studentId: value,
                groupId: undefined,
                paidStudentIds: [],
                subjectId: ''
            }))
            onStudentChange(value, students)
        }
    }

    const handleTopicChange = (val: string) => {
        const matchingTopic = planTopics.find(t => t.title.toLowerCase() === val.toLowerCase())
        setFormData(prev => ({
            ...prev,
            topic: val,
            planTopicId: matchingTopic ? matchingTopic.id : null
        }))
    }

    const handlePlanTopicChange = (value: string | undefined) => {
        if (!value) {
            handleChange('planTopicId', null)
            return
        }
        const topic = planTopics.find(t => t.id === value)
        if (topic) {
            setFormData(prev => ({
                ...prev,
                planTopicId: topic.id,
                topic: topic.title
            }))
        }
    }

    const handlePaidStudentsToggle = (studentId: string) => {
        const currentPaid = formData.paidStudentIds || []
        const isPaid = currentPaid.includes(studentId)
        handleChange('paidStudentIds', isPaid
            ? currentPaid.filter(id => id !== studentId)
            : [...currentPaid, studentId]
        )
    }

    return (
        <form className={styles.form} onClick={(e) => e.stopPropagation()}>
            {!isEdit && (
                <Tabs
                    tabs={[
                        { id: 'single', label: 'Одно занятие' },
                        { id: 'recurring', label: 'Регулярное занятие' }
                    ]}
                    activeTab={activeTab}
                    onChange={handleTabChange}
                />
            )}

            <LessonFormStudentSubject
                studentId={formData.studentId}
                groupId={formData.groupId}
                subjectId={formData.subjectId}
                students={students}
                groups={groups}
                subjects={subjects}
                onStudentOrGroupChange={handleStudentOrGroupChange}
                onSubjectChange={(val) => handleChange('subjectId', val)}
                onCreateStudent={onCreateStudent}
                onCreateSubject={onCreateSubject}
                disabled={isSubmitting}
                fixedStudentId={fixedStudentId}
                fixedGroupId={fixedGroupId}
                fixedSubjectId={fixedSubjectId}
            />

            <LessonFormDateTime
                date={formData.date || new Date()}
                recurrence={formData.recurrence}
                activeTab={activeTab}
                onDateTimeChange={(date, recurrence) => {
                    setFormData(prev => ({ ...prev, date, recurrence }))
                }}
                isEdit={isEdit}
                disabled={isSubmitting}
                link={formData.link}
                onLinkChange={(val) => handleChange('link', val)}
            />


            <LessonFormPriceDuration
                price={formData.price}
                duration={formData.duration}
                date={formData.date}
                isTrial={!!formData.isTrial}
                activeTab={activeTab}
                seriesPrice={formData.seriesPrice}
                onPriceChange={(val) => {
                    handleChange('price', val)
                    if (val === '0') handleChange('isPaid', false)
                }}
                onDurationChange={(val) => handleChange('duration', val)}
                onTrialChange={(val) => handleChange('isTrial', val)}
                onSeriesPriceChange={(val) => handleChange('seriesPrice', val)}
                disabled={isSubmitting}
                isGroup={!!formData.groupId}
            />

            <LessonFormTopic
                topic={formData.topic}
                planTopicId={formData.planTopicId}
                planTopics={planTopics}
                onTopicChange={handleTopicChange}
                onPlanTopicChange={handlePlanTopicChange}
                disabled={isSubmitting}
                show={!formData.recurrence?.enabled}
            />

            <LessonFormPayment
                isPaid={formData.isPaid}
                isPaidAll={formData.isPaidAll}
                paidStudentIds={formData.paidStudentIds}
                price={formData.price}
                seriesPrice={formData.seriesPrice}
                isTrial={!!formData.isTrial}
                activeTab={activeTab}
                groupId={formData.groupId}
                selectedGroup={formData.groupId ? groups.find(g => g.id === formData.groupId) : null}
                onPaidChange={(val) => handleChange('isPaid', val)}
                onPaidAllChange={(val) => {
                    handleChange('isPaidAll', val)
                    if (val) handleChange('isPaid', true)
                }}
                onPaidStudentsToggle={handlePaidStudentsToggle}
                disabled={isSubmitting}
            />

            {error && <div className={styles.error}>{error}</div>}
            {children}
        </form>
    )
}
