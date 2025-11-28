import { useState, useEffect } from 'react'
import { toast } from 'sonner'

/**
 * Generic hook for fetching data from API
 */
export function useFetch<T>(url: string, dependencies: any[] = []) {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch(url)
            if (response.ok) {
                const result = await response.json()
                setData(result)
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
        }
    }

    useEffect(() => {
        fetchData()
    }, dependencies)

    return { data, isLoading, error, refetch: fetchData }
}
