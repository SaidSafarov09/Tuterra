import React from 'react'
import { PlusIcon, DeleteIcon } from '@/components/icons/Icons'
import { Student } from '@/types'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'
import { stringToColor } from '@/lib/utils'


interface StudentGroupsProps {
    student: Student
    onAddGroup: () => void
    onDeleteGroup: (groupId: string, groupName: string) => void
}

export function StudentGroups({ student, onAddGroup, onDeleteGroup }: StudentGroupsProps) {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Группы</h2>
            </div>

            <div className={styles.subjectsGrid}>
                {student.groups?.map((group) => {
                    const baseColor = stringToColor(group.name);
                    const backgroundColor = baseColor.replace(')', ', 0.08)').replace('hsl', 'hsla');
                    const borderColor = baseColor.replace(')', ', 0.19)').replace('hsl', 'hsla');
                    
                    return (
                    <div
                        key={group.id}
                        className={styles.subjectChip}
                        style={{
                            backgroundColor: backgroundColor,
                            color: baseColor,
                            borderColor: borderColor,
                        }}
                    >
                        {group.name}
                        <button
                            className={styles.deleteSubjectButton}
                            onClick={() => onDeleteGroup(group.id, group.name)}
                            title="Удалить ученика из группы"
                        >
                            <DeleteIcon size={14} />
                        </button>
                    </div>
                )})}

                <button
                    className={styles.addSubjectChip}
                    onClick={onAddGroup}
                >
                    <PlusIcon size={14} />
                    Добавить
                </button>
            </div>
        </div>
    )
}
