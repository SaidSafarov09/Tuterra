import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Lesson, LessonFilter } from '@/types'
import { lessonsApi } from '@/services/api'
import { LESSON_MESSAGES } from '@/constants/messages'

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
            const result = await lessonsApi.getAll(tab)
            setLessonsCache(prev => ({
                ...prev,
                [tab]: result
            }))
            loadedTabs.current.add(tab)
        } catch (err) {
            const errorMessage = LESSON_MESSAGES.FETCH_ERROR
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
