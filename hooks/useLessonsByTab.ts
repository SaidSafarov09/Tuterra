import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Lesson, LessonFilter } from '@/types'
import { lessonsApi } from '@/services/api'
import { LESSON_MESSAGES } from '@/constants/messages'

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

    const fetchLessons = useCallback(async (tab: LessonFilter, force = false, isBackground = false) => {
        const isFirstLoad = !loadedTabs.current.has(tab)

        if (isFirstLoad && !force && !isBackground) {
            setIsLoading(true)
        } else if (!isBackground) {
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
            if (!isBackground) {
                setIsLoading(false)
                setIsRefreshing(false)
            }
        }
    }, [])

    const refetch = useCallback(() => {
        fetchLessons(activeTab, true)
    }, [activeTab, fetchLessons])


    useEffect(() => {
        fetchLessons(activeTab)
    }, [activeTab, fetchLessons])


    // Preload other tabs only after the active tab is loaded and with a delay
    useEffect(() => {
        if (hasPreloaded.current || isLoading) return

        const preloadOtherTabs = async () => {
            const tabs: LessonFilter[] = ['upcoming', 'past', 'unpaid', 'canceled']
            const otherTabs = tabs.filter(t => t !== activeTab && !loadedTabs.current.has(t))

            // Fetch other tabs sequentially with a small delay to not slam the server
            for (const tab of otherTabs) {
                await new Promise(resolve => setTimeout(resolve, 500))
                await fetchLessons(tab, false, true)
            }
        }

        hasPreloaded.current = true
        preloadOtherTabs()
    }, [activeTab, fetchLessons, isLoading])


    const allLessonsCount = Object.values(lessonsCache).reduce((total, lessons) => total + lessons.length, 0)


    const lessonsCounts = {
        upcoming: lessonsCache.upcoming.length,
        past: lessonsCache.past.length,
        unpaid: lessonsCache.unpaid.length,
        canceled: lessonsCache.canceled.length
    }

    const isTabLoaded = loadedTabs.current.has(activeTab)

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
