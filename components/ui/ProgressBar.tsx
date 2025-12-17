'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import styles from './ProgressBar.module.scss'

export function ProgressBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        const timer = setTimeout(() => setLoading(false), 500)
        return () => clearTimeout(timer)
    }, [pathname, searchParams])

    if (!loading) return null

    return <div className={styles.progressBar} />
}
