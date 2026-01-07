import React from 'react'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { LearningPlanTopic } from '@/types'
import { useTypewriter } from '@/hooks/useTypewriter'
import { LESSON_TOPIC_EXAMPLES } from '@/constants'
import styles from './LessonForm.module.scss'

interface LessonFormTopicProps {
    topic: string
    planTopicId?: string | null
    planTopics: LearningPlanTopic[]
    isPlanLocked?: boolean
    onTopicChange: (value: string) => void
    onPlanTopicChange: (value: string | undefined) => void
    disabled?: boolean
    show?: boolean
}

export function LessonFormTopic({
    topic,
    planTopicId,
    planTopics,
    isPlanLocked,
    onTopicChange,
    onPlanTopicChange,
    disabled,
    show = true
}: LessonFormTopicProps) {
    const topicPlaceholder = useTypewriter(LESSON_TOPIC_EXAMPLES)

    if (!show) return null

    return (
        <div className={styles.row}>
            {planTopics.length > 0 && (
                <Dropdown
                    label="Тема из плана"
                    placeholder="Выберите тему"
                    value={planTopicId || undefined}
                    onChange={onPlanTopicChange}
                    options={planTopics.map(t => ({
                        value: t.id,
                        label: `${t.isCompleted ? '✓ ' : ''}${t.title}`,
                        isLocked: isPlanLocked
                    }))}
                    menuPosition="relative"
                    disabled={disabled}
                />
            )}
            <Input
                label="Тема урока"
                name="topic"
                value={topic || ''}
                onChange={(e) => onTopicChange(e.target.value)}
                placeholder={`Например: ${topicPlaceholder}`}
                disabled={disabled}
            />
        </div>
    )
}
