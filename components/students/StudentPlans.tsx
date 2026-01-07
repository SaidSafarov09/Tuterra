"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Student, LearningPlan } from '@/types'
import { plansApi, statsApi } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PlanProgressBar } from '@/components/plans/PlanProgressBar'
import { Plus, Edit2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import styles from './StudentPlans.module.scss'
import { useCheckLimit } from '@/hooks/useCheckLimit'

interface StudentPlansProps {
    student: Student
}

export function StudentPlans({ student }: StudentPlansProps) {
    const router = useRouter()
    const [plans, setPlans] = useState<LearningPlan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { checkLimit, UpgradeModal } = useCheckLimit()

    const fetchPlans = async () => {
        try {
            const data = await plansApi.getAll({ studentId: student.id })
            setPlans(data)
        } catch (error) {
            console.error('Fetch plans error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (student.id) fetchPlans()
    }, [student.id])

    const handleCreatePlan = async (subjectId: string) => {
        try {
            const stats = await statsApi.get()
            const plansCount = (stats as any).countStudentPlans || 0

            if (!checkLimit('studentPlans', plansCount)) return

            const newPlan = await plansApi.create({
                studentId: student.id,
                subjectId
            })
            router.push(`/plans/${newPlan.id}`)
        } catch (error) {
            toast.error('Ошибка при создании плана')
        }
    }

    if (isLoading) return null

    const activePlans = plans.filter(p => p.topics && p.topics.length > 0)
    const hasAnyActivePlan = activePlans.length > 0

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>План занятий</h3>
                <div className={styles.subjectsList}>
                    {student.subjects
                        .filter(s => !plans.some(p => p.subjectId === s.id && p.topics && p.topics.length > 0))
                        .map(subject => (
                            <Button
                                key={subject.id}
                                variant="secondary"
                                size="small"
                                onClick={() => handleCreatePlan(subject.id)}
                                className={styles.createBtn}
                            >
                                <Plus size={14} />
                                План: {subject.name}
                            </Button>
                        ))}
                </div>
            </div>

            {!hasAnyActivePlan ? (
                <div className={styles.noPlansContainer}>
                    <p className={styles.emptyText}>План занятий помогает структурировать обучение и отслеживать прогресс</p>
                    {student.subjects.length > 0 ? (
                        <div className={styles.createButtons}>
                            {student.subjects
                                .filter(s => !plans.some(p => p.subjectId === s.id && p.topics && p.topics.length > 0))
                                .map(subject => (
                                    <Button
                                        key={subject.id}
                                        onClick={() => handleCreatePlan(subject.id)}
                                        variant="primary"
                                    >
                                        <Plus size={18} />
                                        Создать план: {subject.name}
                                    </Button>
                                ))}
                        </div>
                    ) : (
                        <p className={styles.emptyHint}>Добавьте предметы ученику, чтобы создать план</p>
                    )}
                </div>
            ) : (
                <div className={styles.grid}>
                    {activePlans.map(plan => {
                        const completedTopics = plan.topics?.filter(t => t.isCompleted).length || 0
                        const totalTopics = plan.topics?.length || 0
                        const subject = student.subjects.find(s => s.id === plan.subjectId)

                        return (
                            <div
                                key={plan.id}
                                className={`${styles.planWrapper} ${plan.isLocked ? styles.lockedPlan : ''}`}
                                onClick={() => {
                                    if (plan.isLocked) {
                                        checkLimit('studentPlans', 100)
                                        return
                                    }
                                    router.push(`/plans/${plan.id}`)
                                }}
                            >
                                <PlanProgressBar
                                    title={subject?.name || 'План'}
                                    total={totalTopics}
                                    completed={completedTopics}
                                    color={subject?.color}
                                />
                                {plan.isLocked && (
                                    <div className={styles.lockBadge}>
                                        <span>PRO</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
            {UpgradeModal}
        </div>
    )
}
