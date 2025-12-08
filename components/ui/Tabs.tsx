import React from 'react'
import styles from './Tabs.module.scss'

interface Tab {
    id: string
    label: string
    icon?: React.ReactNode
}

interface TabsProps {
    tabs: Tab[]
    activeTab: string
    onChange: (tabId: string) => void
    className?: string
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
    return (
        <div className={`${styles.tabsContainer} ${className || ''}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => onChange(tab.id)}
                    type="button"
                >
                    {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
                    {tab.label}
                </button>
            ))}
        </div>
    )
}
