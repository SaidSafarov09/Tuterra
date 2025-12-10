import React from 'react'
import { Group, Subject } from '@/types'
import styles from '../../app/(dashboard)/groups/page.module.scss'

interface GroupFiltersProps {
    subjects: Subject[]
    groups: Group[]
    selectedSubjectFilter: string
    onSelectFilter: (filter: string) => void
}

export function GroupFilters({ subjects, groups, selectedSubjectFilter, onSelectFilter }: GroupFiltersProps) {
    if (subjects.length === 0 || groups.length === 0) return null

    return (
        <div className={styles.filters}>
            <button
                className={`${styles.filterChip} ${selectedSubjectFilter === 'all' ? styles.filterChipActive : ''
                    }`}
                onClick={() => onSelectFilter('all')}
            >
                Все {groups.length}
            </button>

            {subjects.map((subject) => {
                const count = groups.filter((g) => g.subject.id === subject.id).length
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
