"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon, TrashIcon, CheckCircleIcon, CircleIcon } from '@/components/icons/Icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { LearningPlanTopic } from '@/types';
import styles from './page.module.scss';

interface StudentPlanPageProps {
    params: Promise<{ id: string }>;
}

export default function StudentPlanPage({ params }: StudentPlanPageProps) {
    const router = useRouter();
    const [studentId, setStudentId] = useState<string>('');
    const [student, setStudent] = useState<any>(null);
    const [topics, setTopics] = useState<LearningPlanTopic[]>([]);
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        params.then(p => setStudentId(p.id));
    }, [params]);

    useEffect(() => {
        if (studentId) {
            fetchStudent();
        }
    }, [studentId]);

    const fetchStudent = async () => {
        try {
            const response = await fetch(`/api/students/${studentId}`);
            if (!response.ok) throw new Error('Failed to fetch student');
            const data = await response.json();
            setStudent(data);
            setTopics(data.learningPlan || []);
        } catch (error) {
            toast.error('Ошибка при загрузке данных');
            router.push('/students');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTopic = async () => {
        if (!newTopicTitle.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/students/${studentId}/plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTopicTitle })
            });

            if (!response.ok) throw new Error('Failed to add topic');

            setNewTopicTitle('');
            await fetchStudent();
            toast.success('Тема добавлена');
        } catch (error) {
            toast.error('Ошибка при добавлении темы');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleComplete = async (topic: LearningPlanTopic) => {
        try {
            const response = await fetch(`/api/students/${studentId}/plan/${topic.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: !topic.isCompleted })
            });

            if (!response.ok) throw new Error('Failed to update topic');

            await fetchStudent();
        } catch (error) {
            toast.error('Ошибка при обновлении темы');
        }
    };

    const handleDeleteTopic = async (topicId: string) => {
        if (!confirm('Удалить эту тему из плана?')) return;

        try {
            const response = await fetch(`/api/students/${studentId}/plan/${topicId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete topic');

            await fetchStudent();
            toast.success('Тема удалена');
        } catch (error) {
            toast.error('Ошибка при удалении темы');
        }
    };

    const getTopicLessons = (topicId: string) => {
        if (!student?.lessons) return [];
        return student.lessons.filter((l: any) => l.planTopicId === topicId);
    };

    const stringToColor = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 65%, 55%)`;
    };

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (!student) {
        return null;
    }

    const studentColor = stringToColor(student.name);
    const completed = topics.filter(t => t.isCompleted).length;
    const total = topics.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => router.back()}>
                <ArrowLeftIcon size={20} />
                Назад
            </button>

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Учебный план</h1>
                    <p className={styles.subtitle} style={{ color: studentColor }}>
                        {student.name}
                    </p>
                </div>
                {total > 0 && (
                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{completed}/{total}</span>
                            <span className={styles.statLabel}>Завершено</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue} style={{ color: studentColor }}>
                                {percentage}%
                            </span>
                            <span className={styles.statLabel}>Прогресс</span>
                        </div>
                    </div>
                )}
            </div>

            {total > 0 && (
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{
                            width: `${percentage}%`,
                            backgroundColor: studentColor
                        }}
                    />
                </div>
            )}

            <div className={styles.addForm}>
                <Input
                    placeholder="Новая тема..."
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                    disabled={isSubmitting}
                />
                <Button onClick={handleAddTopic} disabled={!newTopicTitle.trim() || isSubmitting}>
                    <PlusIcon size={18} />
                    Добавить
                </Button>
            </div>

            <div className={styles.topicsList}>
                {topics.length === 0 ? (
                    <div className={styles.empty}>
                        <p>План пока пуст</p>
                        <p className={styles.emptyHint}>Добавьте первую тему, чтобы начать</p>
                    </div>
                ) : (
                    topics.map((topic) => {
                        const lessons = getTopicLessons(topic.id);
                        return (
                            <div
                                key={topic.id}
                                className={`${styles.topicCard} ${topic.isCompleted ? styles.completed : ''}`}
                            >
                                <div className={styles.topicHeader}>
                                    <div className={styles.topicMain}>
                                        <button
                                            className={styles.completeButton}
                                            onClick={() => handleToggleComplete(topic)}
                                        >
                                            {topic.isCompleted ? (
                                                <CheckCircleIcon size={24} style={{ color: studentColor }} />
                                            ) : (
                                                <CircleIcon size={24} />
                                            )}
                                        </button>
                                        <h3 className={styles.topicTitle}>{topic.title}</h3>
                                    </div>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => handleDeleteTopic(topic.id)}
                                    >
                                        <TrashIcon size={18} />
                                    </button>
                                </div>

                                {lessons.length > 0 && (
                                    <div className={styles.topicLessons}>
                                        <p className={styles.lessonsTitle}>Занятия по этой теме:</p>
                                        {lessons.map((lesson: any) => (
                                            <div key={lesson.id} className={styles.lessonItem}>
                                                <span className={styles.lessonDate}>
                                                    {new Date(lesson.date).toLocaleDateString('ru-RU', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                {lesson.subject && (
                                                    <span
                                                        className={styles.lessonSubject}
                                                        style={{
                                                            backgroundColor: lesson.subject.color + '20',
                                                            color: lesson.subject.color
                                                        }}
                                                    >
                                                        {lesson.subject.name}
                                                    </span>
                                                )}
                                                <span className={styles.lessonPrice}>{lesson.price} ₽</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
