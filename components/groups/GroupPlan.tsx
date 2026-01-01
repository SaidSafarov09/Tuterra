"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Group, LearningPlan } from '@/types'
import { plansApi } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PlanProgressBar } from '@/components/plans/PlanProgressBar'
import { Plus, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import styles from './GroupPlan.module.scss'
import { useCheckLimit } from '@/hooks/useCheckLimit'

interface GroupPlanProps {
    group: Group
}

export function GroupPlan({ group }: GroupPlanProps) {
    const router = useRouter()
    const [plan, setPlan] = useState<LearningPlan | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const { checkFeature, UpgradeModal } = useCheckLimit()

    const fetchPlan = async () => {
        try {
            const data = await plansApi.getAll({ groupId: group.id })
            if (data.length > 0) {
                setPlan(data[0])
            }
        } catch (error) {
            console.error('Fetch group plan error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (group.id) fetchPlan()
    }, [group.id])

    const handleCreatePlan = async () => {
        if (!checkFeature('groupPlans')) return
        try {
            const newPlan = await plansApi.create({
                groupId: group.id
            })
            router.push(`/plans/${newPlan.id}`)
        } catch (error) {
            toast.error('Ошибка при создании плана')
        }
    }

    if (isLoading) return null

    const hasActivePlan = plan && plan.topics && plan.topics.length > 0
    const completedTopics = plan?.topics?.filter(t => t.isCompleted).length || 0
    const totalTopics = plan?.topics?.length || 0

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>План занятий группы</h3>
            </div>

            {!hasActivePlan ? (
                <div className={styles.noPlansContainer}>
                    <p className={styles.emptyText}>Создайте план для группы, чтобы отслеживать прохождение программы</p>
                    <Button
                        onClick={handleCreatePlan}
                        variant="primary"
                    >
                        <Plus size={18} />
                        Создать план занятий
                    </Button>
                </div>
            ) : (
                <div
                    className={styles.planWrapper}
                    onClick={() => router.push(`/plans/${plan!.id}`)}
                >
                    <PlanProgressBar
                        title={group.name}
                        total={totalTopics}
                        completed={completedTopics}
                        color={group.color || '#4A6CF7'}
                    />
                </div>
            )}
            {UpgradeModal}
        </div>
    )
}
