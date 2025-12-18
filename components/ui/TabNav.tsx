import React from 'react'
import styles from './TabNav.module.scss'

interface Tab {
    id: string
    label: string
    count?: number
}

interface TabNavProps {
    tabs: Tab[]
    activeTab: string | any
    onTabChange: (tabId: string) => void
    className?: string
}

export function TabNav({ tabs, activeTab, onTabChange, className = '' }: TabNavProps) {
    return (
        <div className={`${styles.tabs} ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <span className={styles.tabLabel}>{tab.label}</span>
                </button>
            ))}
        </div>
    )
}
