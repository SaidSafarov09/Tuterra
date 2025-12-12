import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TabNav } from "@/components/ui/TabNav";
import { PlusIcon, NoteIcon } from "@/components/icons/Icons";
import { Lesson, Student, LessonFilter } from "@/types";
import { formatSmartDate } from "@/lib/dateUtils";
import { LESSON_TABS } from "@/constants";
import { LessonActions } from "@/components/lessons/LessonActions";
import { LessonBadges } from "@/components/lessons/LessonBadges";
import { getLessonTimeInfo } from "@/lib/lessonTimeUtils";
import styles from "../../app/(dashboard)/students/[id]/page.module.scss";

interface StudentLessonsProps {
    lessons: Lesson[];
    student: Student;
    onCreateLesson: () => void;
    onEditLesson: (lesson: Lesson) => void;
    onDeleteLesson: (lessonId: string) => void;
    onTogglePaidStatus: (lessonId: string, isPaid: boolean) => void;
    onToggleCancelLesson: (lessonId: string, isCanceled: boolean) => void;
    onRescheduleLesson: (lessonId: string) => void;
    onOpenGroupPayment?: (lesson: Lesson) => void;
}

export function StudentLessons({
    lessons,
    student,
    onCreateLesson,
    onEditLesson,
    onDeleteLesson,
    onTogglePaidStatus,
    onToggleCancelLesson,
    onRescheduleLesson,
    onOpenGroupPayment,
}: StudentLessonsProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<LessonFilter>("upcoming");


    const filteredLessons = useMemo(() => {
        const now = new Date();

        switch (activeTab) {
            case "upcoming":
                return lessons.filter((l) => !l.isCanceled && new Date(l.date) >= now);
            case "past":
                return lessons.filter((l) => !l.isCanceled && new Date(l.date) < now);
            case "unpaid":
                return lessons.filter((l) => !l.isCanceled && !l.isPaid && l.price > 0);
            case "canceled":
                return lessons.filter((l) => l.isCanceled);
            default:
                return lessons;
        }
    }, [lessons, activeTab]);

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>История занятий</h2>
                <Button variant="secondary" size="small" onClick={onCreateLesson}>
                    <PlusIcon size={16} />
                    Добавить
                </Button>
            </div>

            <TabNav
                tabs={LESSON_TABS}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as LessonFilter)}
            />

            {lessons.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptyText}>У этого ученика пока нет занятий</p>
                    <Button onClick={onCreateLesson}>Создать первое занятие</Button>
                </div>
            ) : filteredLessons.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptyText}>Нет занятий в этой категории</p>
                </div>
            ) : (
                <div className={styles.lessonsList}>
                    {filteredLessons.map((lesson, index) => {
                        const subject = lesson.subject;
                        return (
                            <div
                                key={lesson.id}
                                className={styles.lessonCard}
                                onClick={() =>
                                    router.push(`/lessons/${lesson.slug || lesson.id}`)
                                }
                            >
                                <div className={styles.lessonHeader}>
                                    <div>
                                        <div className={styles.lessonDateContainer}>
                                            <h3 className={styles.lessonDate}>
                                                {formatSmartDate(new Date(lesson.date))}
                                            </h3>
                                            <span
                                                className={styles.lessonTime}
                                            >
                                                {getLessonTimeInfo(
                                                    new Date(lesson.date),
                                                    lesson.duration
                                                )}
                                            </span>
                                            {subject ? (
                                                <span
                                                    className={styles.lessonSubject}
                                                    style={{
                                                        color: subject.color,
                                                        backgroundColor: subject.color + '15',
                                                        borderColor: subject.color + '30',
                                                    }}
                                                >
                                                    {subject.name}
                                                </span>
                                            ) : (
                                                <span className={styles.lessonSubject} style={{ color: 'var(--text-secondary)', background: 'var(--background)' }}>
                                                    Без предмета
                                                </span>
                                            )}
                                            {lesson.group && (
                                                <span
                                                    className={styles.lessonSubject}
                                                    style={{
                                                        color: '#6366f1',
                                                        backgroundColor: '#6366f115',
                                                        borderColor: '#6366f130',
                                                    }}
                                                >
                                                    {lesson.group.name}
                                                </span>
                                            )}
                                        </div>
                                        {lesson.topic && (
                                            <div className={styles.lessonTopic}>
                                                <NoteIcon size={14} className={styles.topicIcon} />
                                                <span className={styles.topicLabel}>Тема урока:</span>
                                                <span className={styles.topicText}>
                                                    {lesson.topic.length > 50
                                                        ? `${lesson.topic.slice(0, 50)}...`
                                                        : lesson.topic}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.lessonPriceContainer}>
                                        <span className={styles.lessonPrice}>
                                            {lesson.group && lesson.lessonPayments
                                                ? lesson.lessonPayments.filter(p => p.hasPaid).length * lesson.price
                                                : lesson.price} ₽
                                        </span>
                                        <LessonBadges
                                            price={lesson.price}
                                            isPaid={lesson.isPaid}
                                            isTrial={lesson.isTrial}
                                            isGroupLesson={!!lesson.group}
                                            totalStudents={lesson.group?.students?.length || 0}
                                            lessonPayments={lesson.lessonPayments}
                                        />
                                    </div>
                                </div>

                                <div onClick={(e) => e.stopPropagation()}>
                                    <LessonActions
                                        lesson={lesson}
                                        onTogglePaid={(l) => {
                                            if (l.group && onOpenGroupPayment) {
                                                onOpenGroupPayment(l)
                                            } else {
                                                onTogglePaidStatus(l.id, !l.isPaid)
                                            }
                                        }}
                                        onToggleCancel={(l) =>
                                            onToggleCancelLesson(l.id, !l.isCanceled)
                                        }
                                        onReschedule={(l) => onRescheduleLesson(l.id)}
                                        onEdit={onEditLesson}
                                        onDelete={onDeleteLesson}
                                        index={index}
                                        totalItems={filteredLessons.length}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
