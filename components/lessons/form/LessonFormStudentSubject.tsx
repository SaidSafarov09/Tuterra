import React from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import { Student, Group, Subject } from '@/types'
import styles from './LessonForm.module.scss'

interface LessonFormStudentSubjectProps {
    studentId?: string
    groupId?: string
    subjectId: string
    students: Student[]
    groups: Group[]
    subjects: Subject[]
    onStudentOrGroupChange: (value: string) => void
    onSubjectChange: (value: string) => void
    onCreateStudent?: (name: string) => void
    onCreateSubject?: (name: string) => void
    disabled?: boolean
    fixedStudentId?: string
    fixedGroupId?: string
    fixedSubjectId?: string
}

export function LessonFormStudentSubject({
    studentId,
    groupId,
    subjectId,
    students,
    groups,
    subjects,
    onStudentOrGroupChange,
    onSubjectChange,
    onCreateStudent,
    onCreateSubject,
    disabled,
    fixedStudentId,
    fixedGroupId,
    fixedSubjectId,
}: LessonFormStudentSubjectProps) {
    const getStudentOptions = () => {
        const options = []
        if (groups.length > 0) {
            options.push({ label: 'Группы', options: groups.map(g => ({ value: `group_${g.id}`, label: g.name })) })
        }
        if (students.length > 0) {
            options.push({ label: 'Ученики', options: students.map(s => ({ value: s.id, label: s.name })) })
        }
        return options
    }

    const selectedValue = groupId ? `group_${groupId}` : studentId

    return (
        <div className={styles.row}>
            <Dropdown
                label={fixedStudentId ? "Ученик" : fixedGroupId ? "Группа" : "Ученик / Группа"}
                placeholder="Выберите ученика или группу"
                value={selectedValue}
                onChange={onStudentOrGroupChange}
                options={getStudentOptions()}
                searchable
                creatable={!fixedStudentId && !fixedGroupId && !groupId}
                onCreate={onCreateStudent}
                menuPosition="relative"
                required
                disabled={disabled || !!fixedStudentId || !!fixedGroupId}
            />

            <Dropdown
                label="Предмет"
                placeholder="Выберите или создайте предмет"
                value={subjectId}
                onChange={onSubjectChange}
                options={subjects.map((subject) => ({
                    value: subject.id,
                    label: subject.name,
                }))}
                searchable
                creatable={!fixedSubjectId}
                onCreate={onCreateSubject}
                menuPosition="relative"
                disabled={disabled || !!fixedSubjectId || (!!groupId && groups.some(g => g.id === groupId))}
            />
        </div>
    )
}
