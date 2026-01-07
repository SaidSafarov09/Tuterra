import { useState, useEffect } from 'react'
import { LearningPlanTopic } from '@/types'
import { plansApi } from '@/services/api'

export function usePlanTopics(
    studentId?: string,
    groupId?: string,
    subjectId?: string,
    enabled: boolean = true
) {
    const [planTopics, setPlanTopics] = useState<LearningPlanTopic[]>([])
    const [isLocked, setIsLocked] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetchPlanTopics = async () => {
            if (!enabled || (!groupId && !studentId)) {
                setPlanTopics([])
                setIsLocked(false)
                return
            }

            setIsLoading(true)
            try {
                let plans: any[] = []
                if (groupId) {
                    plans = await plansApi.getAll({ groupId })
                } else if (studentId && subjectId) {
                    plans = await plansApi.getAll({ studentId, subjectId })
                }

                if (plans.length > 0) {
                    setPlanTopics(plans[0].topics || [])
                    setIsLocked(!!plans[0].isLocked)
                } else {
                    setPlanTopics([])
                    setIsLocked(false)
                }
            } catch (error) {
                console.error('Error fetching plan topics:', error)
                setPlanTopics([])
                setIsLocked(false)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPlanTopics()
    }, [studentId, groupId, subjectId, enabled])

    return { planTopics, isLocked, isLoading }
}
