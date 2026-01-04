import React from 'react'
import { Subject, LessonFormData, Student } from '@/types'
import { usePlanTopics } from '@/hooks/usePlanTopics'
import { LessonFormStudentSubject } from './form/LessonFormStudentSubject'
import { LessonFormDateTime } from './form/LessonFormDateTime'
import { LessonFormPriceDuration } from './form/LessonFormPriceDuration'
import { LessonFormTopic } from './form/LessonFormTopic'
import { LessonFormPayment } from './form/LessonFormPayment'
import styles from './form/LessonForm.module.scss'

interface LessonFormWithDateTimeProps {
    formData: LessonFormData
    setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>
    subjects: Subject[]
    onCreateSubject: (name: string) => void
    isEdit?: boolean
    isSubmitting?: boolean
    showStudentField?: boolean
    students?: Student[]
    onStudentChange?: (studentId: string) => void
    onCreateStudent?: (name: string) => void
}

export function LessonFormWithDateTime({
    formData,
    setFormData,
    subjects,
    onCreateSubject,
    isEdit = false,
    isSubmitting = false,
    showStudentField = false,
    students = [],
    onStudentChange,
    onCreateStudent,
}: LessonFormWithDateTimeProps) {
    const activeTab = formData.recurrence?.enabled ? 'recurring' : 'single'

    const { planTopics } = usePlanTopics(
        formData.studentId,
        formData.groupId,
        formData.subjectId,
        activeTab === 'single'
    )

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }))
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

    return (
        <div className={styles.form}>
            {showStudentField && (
                <LessonFormStudentSubject
                    studentId={formData.studentId}
                    groupId={formData.groupId}
                    subjectId={formData.subjectId}
                    students={students}
                    groups={[]} // This version seems to only handle students or maybe it was simplified
                    subjects={subjects}
                    onStudentOrGroupChange={(val) => onStudentChange?.(val)}
                    onSubjectChange={(val) => handleChange('subjectId', val)}
                    onCreateStudent={onCreateStudent}
                    onCreateSubject={onCreateSubject}
                    disabled={isSubmitting}
                />
            )}

            {!showStudentField && (
                <LessonFormStudentSubject
                    studentId={formData.studentId}
                    groupId={formData.groupId}
                    subjectId={formData.subjectId || ''}
                    students={[]}
                    groups={[]}
                    subjects={subjects}
                    onStudentOrGroupChange={() => { }}
                    onSubjectChange={(val) => handleChange('subjectId', val)}
                    onCreateSubject={onCreateSubject}
                    disabled={isSubmitting}
                    fixedStudentId={formData.studentId}
                    fixedGroupId={formData.groupId}
                />
            )}

            <LessonFormDateTime
                date={formData.date || new Date()}
                recurrence={formData.recurrence}
                activeTab={activeTab}
                onDateTimeChange={(date, recurrence) => {
                    setFormData(prev => ({ ...prev, date, recurrence }))
                }}
                isEdit={isEdit}
                disabled={isSubmitting}
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
                onPaidChange={(val) => handleChange('isPaid', val)}
                onPaidAllChange={(val) => {
                    handleChange('isPaidAll', val)
                    if (val) handleChange('isPaid', true)
                }}
                disabled={isSubmitting}
            />
        </div>
    )
}
