import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

/**
 * Generic hook for fetching data from API
 * Keeps previous data while loading new data to prevent UI jumps
 */
export function useFetch<T>(url: string, dependencies: any[] = []) {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const isFirstLoad = useRef(true)

    const fetchData = async () => {
        
        if (isFirstLoad.current) {
            setIsLoading(true)
        } else {
            setIsRefreshing(true)
        }
        setError(null)

        try {
            const response = await fetch(url)
            if (response.ok) {
                const result = await response.json()
                setData(result)
                isFirstLoad.current = false
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
    }

    useEffect(() => {
        fetchData()
    }, dependencies)

    return { data, isLoading, isRefreshing, error, refetch: fetchData }
}
