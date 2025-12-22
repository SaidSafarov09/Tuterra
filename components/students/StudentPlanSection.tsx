import React from 'react'
import Link from 'next/link'
import { LearningPlanTopic } from '@/types'
import styles from './StudentPlanSection.module.scss'

interface StudentPlanSectionProps {
    studentId: string
    studentSlug: string
    studentName: string
    studentColor: string
    learningPlan: LearningPlanTopic[]
}

export function StudentPlanSection({
    studentId,
    studentSlug,
    studentName,
    studentColor,
    learningPlan
}: StudentPlanSectionProps) {
    if (!learningPlan || learningPlan.length === 0) {
        return (
            <div className={styles.planSection}>
                <div className={styles.planHeader}>
                    <h3 className={styles.planTitle}>Учебный план</h3>
                    <Link href={`/students/${studentSlug}/plan`} className={styles.createButton}>
                        + Составить учебный план
                    </Link>
                </div>
            </div>
        )
    }

    const completed = learningPlan.filter(t => t.isCompleted).length
    const total = learningPlan.length
    const percentage = Math.round((completed / total) * 100)

    return (
        <Link href={`/students/${studentSlug}/plan`} className={styles.planSection}>
            <div className={styles.planHeader}>
                <h3 className={styles.planTitle}>Учебный план</h3>
                <span className={styles.planStats}>{completed} из {total}</span>
            </div>
            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: studentColor
                    }}
                />
            </div>
            <div className={styles.planFooter}>
                <span className={styles.percentage}>{percentage}% завершено</span>
                <span className={styles.viewLink}>Открыть план →</span>
            </div>
        </Link>
    )
}
