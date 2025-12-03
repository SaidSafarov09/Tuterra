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
    const hasPreloaded = useRef(false)

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

    // Load active tab data
    useEffect(() => {
        fetchLessons(activeTab)
    }, [activeTab, fetchLessons])

    // Preload all tabs on initial mount for badge counts
    useEffect(() => {
        if (hasPreloaded.current) return

        const preloadAllTabs = async () => {
            const tabs: LessonFilter[] = ['upcoming', 'past', 'unpaid', 'canceled']
            // Load all tabs in parallel
            await Promise.all(
                tabs.map(tab => {
                    if (!loadedTabs.current.has(tab)) {
                        return fetchLessons(tab)
                    }
                    return Promise.resolve()
                })
            )
        }

        hasPreloaded.current = true
        preloadAllTabs()
    }, [fetchLessons])

    // Calculate total lessons count across all tabs
    const allLessonsCount = Object.values(lessonsCache).reduce((total, lessons) => total + lessons.length, 0)

    // Calculate counts for each tab
    const lessonsCounts = {
        upcoming: lessonsCache.upcoming.length,
        past: lessonsCache.past.length,
        unpaid: lessonsCache.unpaid.length,
        canceled: lessonsCache.canceled.length
    }

    const isTabLoaded = loadedTabs.current.has(activeTab)
    // Show loading if global loading is true OR if current tab hasn't been loaded yet
    const shouldShowLoading = isLoading || !isTabLoaded

    return {
        lessons: lessonsCache[activeTab],
        allLessonsCount,
        lessonsCounts,
        isLoading: shouldShowLoading,
        isRefreshing,
        error,
        refetch
    }
}
