"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { plansApi } from '@/services/api'
import { LearningPlan, LearningPlanTopic } from '@/types'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { Trash2, GripVertical, Save, Loader2, Plus, CheckCircle2, Calendar, User, BookOpen } from 'lucide-react'
import { formatSmartDate } from '@/lib/dateUtils'
import { useCheckLimit } from '@/hooks/useCheckLimit'
import styles from './PlanEditor.module.scss'

interface PlanEditorProps {
    planId: string
}

export function PlanEditor({ planId }: PlanEditorProps) {
    const router = useRouter()
    const [plan, setPlan] = useState<LearningPlan | null>(null)
    const [topics, setTopics] = useState<Partial<LearningPlanTopic>[]>([])
    const [originalTopics, setOriginalTopics] = useState<Partial<LearningPlanTopic>[]>([])
    const [newTopicTitle, setNewTopicTitle] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const { checkLimit, UpgradeModal } = useCheckLimit()
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Проверка наличия несохраненных изменений
    const hasUnsavedChanges = () => {
        if (topics.length !== originalTopics.length) return true
        return topics.some((topic, index) => {
            const original = originalTopics[index]
            return topic.title !== original?.title
        })
    }

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const data = await plansApi.getById(planId)
                setPlan(data)
                const planTopics = data.topics || []
                setTopics(planTopics)
                setOriginalTopics(planTopics)
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

        if ((plan as any)?.isLocked) {
            checkLimit('studentPlans', 100)
            return
        }

        const newTopic: Partial<LearningPlanTopic> = {
            title: newTopicTitle.trim(),
            order: topics.length
        }
        setTopics([...topics, newTopic])
        setNewTopicTitle('')

        setTimeout(() => inputRef.current?.focus(), 0)
    }

    const handleUpdateTopic = (index: number, title: string) => {
        if ((plan as any)?.isLocked) {
            checkLimit('studentPlans', 100)
            return
        }
        const newTopics = [...topics]
        newTopics[index] = { ...newTopics[index], title }
        setTopics(newTopics)
    }

    const handleRemoveTopic = (index: number) => {
        if ((plan as any)?.isLocked) {
            checkLimit('studentPlans', 100)
            return
        }
        setTopics(topics.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if ((plan as any)?.isLocked) {
            checkLimit('studentPlans', 100)
            return
        }
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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const stringToColor = (str: string): string => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        const hue = Math.abs(hash % 360)
        return `hsl(${hue}, 65%, 55%)`
    }

    const displayName = plan.student?.name || plan.group?.name || 'Ученик'
    const studentAvatar = plan.student?.avatar || plan.student?.linkedUser?.avatar

    const handleBack = () => {
        if (hasUnsavedChanges()) {
            setShowUnsavedDialog(true)
        } else {
            router.back()
        }
    }

    const handleDiscardChanges = () => {
        setShowUnsavedDialog(false)
        router.back()
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={handleBack}>
                    ← Назад
                </button>
            </div>

            <div className={styles.planHeader}>
                <div className={styles.headerTop}>
                    <div className={styles.profile}>
                        <div
                            className={styles.avatar}
                            style={{ backgroundColor: !studentAvatar ? stringToColor(displayName) : undefined }}
                        >
                            {studentAvatar ? (
                                <img src={studentAvatar} alt={displayName} className={styles.avatarImage} />
                            ) : (
                                getInitials(displayName)
                            )}
                        </div>
                        <div className={styles.info}>
                            <h1 className={styles.name}>План занятий для {displayName}</h1>
                            {plan.subject?.name && (
                                <div className={styles.subjectTag}>
                                    {plan.subject.name}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            isLoading={isSaving}
                            className={styles.saveBtn}
                        >
                            <Save size={18} />
                            Сохранить
                        </Button>
                    </div>
                </div>
            </div>

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

            {/* Модалка подтверждения выхода без сохранения */}
            {showUnsavedDialog && (
                <div className={styles.dialogOverlay} onClick={() => setShowUnsavedDialog(false)}>
                    <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                        <h3>Несохраненные изменения</h3>
                        <p>У вас есть несохраненные изменения. Вы уверены, что хотите выйти без сохранения?</p>
                        <div className={styles.dialogActions}>
                            <Button
                                variant="secondary"
                                onClick={() => setShowUnsavedDialog(false)}
                            >
                                Отмена
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDiscardChanges}
                            >
                                Выйти без сохранения
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {UpgradeModal}
        </div>
    )
}
