import React from 'react'
import { Student, Subject } from '@/types'
import styles from '../../app/(dashboard)/students/page.module.scss'

interface StudentFiltersProps {
    subjects: Subject[]
    students: Student[]
    selectedSubjectFilter: string
    onSelectFilter: (filter: string) => void
}

export function StudentFilters({ subjects, students, selectedSubjectFilter, onSelectFilter }: StudentFiltersProps) {
    if (subjects.length === 0 || students.length === 0) return null

    return (
        <div className={styles.filters}>
            <button
                className={`${styles.filterChip} ${selectedSubjectFilter === 'all' ? styles.filterChipActive : ''
                    }`}
                onClick={() => onSelectFilter('all')}
            >
                Все {students.length}
            </button>

            {subjects.map((subject) => {
                const count = students.filter((s) => s.subjects.some(subj => subj.id === subject.id)).length
                if (count === 0) return null

                return (
                    <button
                        key={subject.id}
                        className={`${styles.filterChip} ${selectedSubjectFilter === subject.id
                            ? styles.filterChipActive
                            : ''
                            }`}
                        style={{
                            borderColor: subject.color,
                            color:
                                selectedSubjectFilter === subject.id
                                    ? 'white'
                                    : subject.color,
                            background:
                                selectedSubjectFilter === subject.id
                                    ? subject.color
                                    : `${subject.color}10`,
                        }}
                        onClick={() => onSelectFilter(subject.id)}
                    >
                        {subject.name} {count}
                    </button>
                )
            })}
        </div>
    )
}
