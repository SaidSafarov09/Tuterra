'use client'

import React, { useState } from 'react'
import { Video, ExternalLink, Edit2, Save, X } from 'lucide-react'
import { Lesson } from '@/types'
import { lessonsApi } from '@/services/api'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import styles from './LessonLinkSection.module.scss'

interface LessonLinkSectionProps {
    lesson: Lesson
    isStudentView?: boolean
}

export function LessonLinkSection({ lesson, isStudentView }: LessonLinkSectionProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [link, setLink] = useState(lesson.link || '')
    const [isSaving, setIsSaving] = useState(false)
    const isMobile = useMediaQuery('(max-width: 768px)')

    const isPast = new Date(lesson.date) < new Date()
    const isCanceled = lesson.isCanceled

    if (isCanceled) return null
    if (isPast && !lesson.link) return null

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const updated = await lessonsApi.update(lesson.id, { link })
            lesson.link = updated.link
            setIsEditing(false)
            toast.success('Ссылка сохранена')
        } catch (error) {
            toast.error('Ошибка при сохранении')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isEditing && !isStudentView) {
        return (
            <div className={styles.linkSection}>
                <div className={styles.linkInputWrapper}>
                    <Input
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="Вставьте ссылку на урок (Zoom, Meet...)"
                        className={styles.linkInput}
                        autoFocus
                    />
                    <div className={styles.editActions}>
                        <button
                            className={styles.saveLinkBtn}
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save size={16} />
                            {!isMobile && (isSaving ? 'Сохранение...' : 'Сохранить')}
                        </button>
                        <button
                            className={styles.cancelBtn}
                            onClick={() => {
                                setIsEditing(false)
                                setLink(lesson.link || '')
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`${styles.linkSection} ${isPast ? styles.pastLinkSection : ''}`}>
            {lesson.link ? (
                <div className={styles.linkDisplay}>
                    <a
                        href={lesson.link.startsWith('http') ? lesson.link : `https://${lesson.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.joinLink} ${isPast ? styles.disabledLink : ''}`}
                        onClick={(e) => {
                            if (isPast) e.preventDefault()
                            e.stopPropagation()
                        }}
                    >
                        <Video size={18} />
                        <span>{isPast ? 'Урок завершен' : 'Присоединиться к уроку'}</span>
                        {!isPast && <ExternalLink size={14} className={styles.externalIcon} />}
                    </a>
                    {!isStudentView && !isPast && (
                        <button
                            className={styles.editBtn}
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsEditing(true)
                            }}
                            title="Редактировать ссылку"
                        >
                            <Edit2 size={16} />
                        </button>
                    )}
                </div>
            ) : (
                !isStudentView && (
                    <button
                        className={styles.addLinkBtn}
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsEditing(true)
                        }}
                    >
                        <Video size={18} />
                        Добавить ссылку на урок
                    </button>
                )
            )}
        </div>
    )
}
