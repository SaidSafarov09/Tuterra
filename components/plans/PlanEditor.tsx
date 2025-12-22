"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { plansApi } from '@/services/api'
import { LearningPlan, LearningPlanTopic } from '@/types'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { Trash2, GripVertical, Save, Loader2, Plus, CheckCircle2, Calendar, User, BookOpen } from 'lucide-react'
import { formatSmartDate } from '@/lib/dateUtils'
import styles from './PlanEditor.module.scss'

interface PlanEditorProps {
    planId: string
}

export function PlanEditor({ planId }: PlanEditorProps) {
    const router = useRouter()
    const [plan, setPlan] = useState<LearningPlan | null>(null)
    const [topics, setTopics] = useState<Partial<LearningPlanTopic>[]>([])
    const [newTopicTitle, setNewTopicTitle] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const data = await plansApi.getById(planId)
                setPlan(data)
                setTopics(data.topics || [])
            } catch (error) {
                toast.error('Ошибка при загрузке плана')
                router.back()
            } finally {
                setIsLoading(false)
            }
        }
        fetchPlan()
    }, [planId, router])

    const handleAddTopic = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newTopicTitle.trim()) return

        const newTopic: Partial<LearningPlanTopic> = {
            title: newTopicTitle.trim(),
            order: topics.length
        }
        setTopics([...topics, newTopic])
        setNewTopicTitle('')

        setTimeout(() => inputRef.current?.focus(), 0)
    }

    const handleUpdateTopic = (index: number, title: string) => {
        const newTopics = [...topics]
        newTopics[index] = { ...newTopics[index], title }
        setTopics(newTopics)
    }

    const handleRemoveTopic = (index: number) => {
        setTopics(topics.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (topics.length === 0) {
            toast.error('Добавьте хотя бы одну тему')
            return
        }

        setIsSaving(true)
        try {
            const topicsToSave = topics.map((t, i) => ({
                id: t.id,
                title: t.title,
                order: i
            }))
            await plansApi.update(planId, { topics: topicsToSave as any })
            toast.success('План сохранен')
            router.refresh() // Refresh server components if any
            router.back()
        } catch (error) {
            toast.error('Ошибка при сохранении плана')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <Loader2 className={styles.spinner} />
                <span>Загрузка плана...</span>
            </div>
        )
    }

    if (!plan) return null

    const title = plan.student
        ? `План обучения: ${plan.student.name}`
        : `План обучения: ${plan.group?.name}`

    const subtitle = plan.subject?.name || ''

    return (
        <div className={styles.container}>
            <PageHeader
                title={title}
                subtitle={subtitle}
                action={
                    <div className={styles.actions}>
                        <Button
                            variant="secondary"
                            onClick={() => router.back()}
                            disabled={isSaving}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            isLoading={isSaving}
                            className={styles.saveBtn}
                        >
                            <Save size={18} />
                            Готово
                        </Button>
                    </div>
                }
            />

            <div className={styles.editorContent}>
                <div className={styles.topicsList}>
                    {topics.map((topic, index) => (
                        <div key={index} className={styles.topicRowWrapper}>
                            <div className={styles.topicRow}>
                                <div className={styles.dragHandle}>
                                    <GripVertical size={18} />
                                </div>
                                <div className={styles.topicIndex}>{index + 1}</div>
                                <div className={styles.topicMain}>
                                    <input
                                        className={styles.topicInput}
                                        value={topic.title || ''}
                                        onChange={(e) => handleUpdateTopic(index, e.target.value)}
                                        placeholder="Название темы..."
                                    />
                                    {topic.isCompleted && (
                                        <CheckCircle2 size={16} className={styles.completedIcon} />
                                    )}
                                </div>
                                <button
                                    className={styles.deleteAction}
                                    onClick={() => handleRemoveTopic(index)}
                                    title="Удалить тему"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {topic.lastLesson && (
                                <div className={styles.lessonDetails}>
                                    <div className={styles.lessonInfoCard}>
                                        <div className={styles.lessonHeader}>
                                            <div className={styles.lessonTime}>
                                                <Calendar size={14} />
                                                <span>{formatSmartDate(topic.lastLesson.date)}</span>
                                            </div>
                                            <span className={styles.completedLabel}>Пройдено</span>
                                        </div>
                                        <div className={styles.lessonContent}>
                                            <div className={styles.detailItem}>
                                                <BookOpen size={14} />
                                                <span>{topic.lastLesson.subject?.name || 'Предмет не указан'}</span>
                                            </div>
                                            {(topic.lastLesson.student?.name || topic.lastLesson.group?.name) && (
                                                <div className={styles.detailItem}>
                                                    <User size={14} />
                                                    <span>{topic.lastLesson.student?.name || topic.lastLesson.group?.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddTopic} className={styles.addForm}>
                    <div className={styles.addInputGroup}>
                        <div className={styles.addIcon}>
                            <Plus size={20} />
                        </div>
                        <input
                            ref={inputRef}
                            className={styles.newTopicInput}
                            placeholder="Напишите название темы..."
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                        />
                        {newTopicTitle.trim() && (
                            <button type="submit" className={styles.submitTopicBtn}>
                                <Plus size={18} />
                                <span>Добавить</span>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
