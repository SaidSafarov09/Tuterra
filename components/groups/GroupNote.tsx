import React from 'react'
import { Group } from '@/types'
import styles from '../../app/(dashboard)/students/[id]/page.module.scss'
import { stringToColor } from '@/lib/utils'

interface GroupNoteProps {
    group: Group
}

export function GroupNote({ group }: GroupNoteProps) {

    return (
        <>
            {group.note && (
                <div className={styles.Note}>
                    <div
                        style={{ backgroundColor: stringToColor(group.name) }}
                        className={styles.leftBar}
                    />
                    <strong>Заметка</strong>
                    <p>{group.note}</p>
                </div>
            )}
        </>
    )
}
