import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Lesson, LessonFilter } from '@/types'

/**
 * Hook for fetching lessons with tab-based caching
 * Caches data for each tab to prevent reloading when switching between tabs
 */
export function useLessonsByTab(activeTab: LessonFilter) {
    const [lessonsCache, setLessonsCache] = useState<Record<LessonFilter, Lesson[]>>({
        all: [],
        upcoming: [],
        past: [],
        unpaid: [],
        canceled: []
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const loadedTabs = useRef<Set<LessonFilter>>(new Set())

    const fetchLessons = useCallback(async (tab: LessonFilter, force = false) => {
        const isFirstLoad = !loadedTabs.current.has(tab)

        if (isFirstLoad && !force) {
            setIsLoading(true)
        } else {
            setIsRefreshing(true)
        }
        setError(null)

        try {
            const response = await fetch(`/api/lessons?filter=${tab}`)
            if (response.ok) {
                const result = await response.json()
                setLessonsCache(prev => ({
                    ...prev,
                    [tab]: result
                }))
                loadedTabs.current.add(tab)
            } else {
                const errorMessage = 'Не удалось загрузить данные'
                setError(errorMessage)
                toast.error(errorMessage)
            }
        } catch (err) {
            const errorMessage = 'Произошла ошибка при загрузке'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    const refetch = useCallback(() => {
        fetchLessons(activeTab, true)
    }, [activeTab, fetchLessons])

    useEffect(() => {
        fetchLessons(activeTab)
    }, [activeTab, fetchLessons])

    return {
        lessons: lessonsCache[activeTab],
        isLoading,
        isRefreshing,
        error,
        refetch
    }
}
