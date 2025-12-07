import React from 'react'
import { LessonStatusBadge } from './LessonStatusBadge'
import { TrialBadge } from './TrialBadge'
import styles from './LessonBadges.module.scss'

interface LessonBadgesProps {
    price: number
    isPaid: boolean
    isTrial?: boolean
}

export function LessonBadges({ price, isPaid, isTrial }: LessonBadgesProps) {
    return (
        <div className={styles.badges}>
            {isTrial && <TrialBadge />}
            <LessonStatusBadge price={price} isPaid={isPaid} />
        </div>
    )
}
