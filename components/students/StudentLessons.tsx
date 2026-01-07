import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TabNav } from "@/components/ui/TabNav";
import { PlusIcon, NoteIcon } from "@/components/icons/Icons";
import { Lesson, Student, LessonFilter } from "@/types";
import { formatSmartDate } from "@/lib/dateUtils";
import { LESSON_TABS, stringToColor } from "@/constants";
import { LessonActions } from "@/components/lessons/LessonActions";
import { LessonBadges } from "@/components/lessons/LessonBadges";
import { getLessonTimeInfo, isLessonPast, isLessonOngoing } from "@/lib/lessonTimeUtils";
import { LessonLinkSection } from "@/components/lessons/LessonLinkSection";
import styles from "../../app/(dashboard)/students/[id]/page.module.scss";

import { useAuthStore } from "@/store/auth";

interface StudentLessonsProps {
    lessons: Lesson[];
    student: Student;
    onCreateLesson?: () => void;
    onEditLesson?: (lesson: Lesson) => void;
    onDeleteLesson?: (lessonId: string) => void;
    onTogglePaidStatus?: (lessonId: string, isPaid: boolean) => void;
    onToggleCancelLesson: (lessonId: string, isCanceled: boolean) => void;
    onRescheduleLesson: (lessonId: string) => void;
    onOpenGroupPayment?: (lesson: Lesson) => void;
    isStudentView?: boolean;
    emptyText?: string;
    isLocked?: boolean;
    onLockedAction?: (message: string) => void;
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
    isStudentView = false,
    emptyText = "У этого ученика пока нет занятий",
    isLocked,
    onLockedAction,
}: StudentLessonsProps) {
    const router = useRouter();
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState<LessonFilter>("upcoming");

    // Sync tab with URL
    React.useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const tab = searchParams.get('tab') as LessonFilter;
        if (tab && ["upcoming", "past", "unpaid", "canceled"].includes(tab)) {
            setActiveTab(tab);
        }
    }, []);

    const filteredLessons = useMemo(() => {
        let filtered = [];

        switch (activeTab) {
            case "upcoming":
                filtered = lessons.filter((l) => !l.isCanceled && !isLessonPast(l.date, l.duration || 60));
                return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ascending (Nearest first)
            case "past":
                filtered = lessons.filter((l) => !l.isCanceled && isLessonPast(l.date, l.duration || 60));
                return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Descending (Recent first)
            case "unpaid":
                filtered = lessons.filter((l) => {
                    if (l.isCanceled || l.price === 0) return false;

                    // Identify Context: Are we on a Group Page or Student Page?
                    // On Group Page, the 'student' prop acts as a mock with student.id === group.id
                    const isGroupPage = l.group && student.id === l.group.id;

                    if (isGroupPage) {
                        // Group Page Logic: Show as Unpaid if NOT fully paid (i.e. partially paid or unpaid)
                        if (l.group && l.group.students && l.lessonPayments) {
                            const paidCount = l.lessonPayments.filter(p => p.hasPaid).length;
                            const total = l.group.students.length;
                            if (total > 0 && paidCount >= total) return false; // Fully Paid -> Hide
                        }
                        return true; // Else show
                    } else {
                        // Student Page Logic: Rely on isPaid flag (computed for this student in page.tsx)
                        if (l.isPaid) return false; // Student paid -> Hide
                        return true; // Student didn't pay -> Show
                    }
                });
                return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            case "canceled":
                filtered = lessons.filter((l) => l.isCanceled);
                return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Descending
            default:
                return lessons;
        }
    }, [lessons, activeTab]);

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>История занятий</h2>
                {!isStudentView && onCreateLesson && (
                    <Button variant="secondary" size="small" onClick={onCreateLesson}>
                        <PlusIcon size={16} />
                        Добавить
                    </Button>
                )}
            </div>

            <TabNav
                tabs={LESSON_TABS}
                activeTab={activeTab}
                onTabChange={(tab) => {
                    setActiveTab(tab as LessonFilter);
                    const params = new URLSearchParams(window.location.search);
                    params.set('tab', tab);
                    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
                }}
            />

            {lessons.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptyText}>{emptyText}</p>
                    {!isStudentView && onCreateLesson && (
                        <Button onClick={onCreateLesson}>Создать первое занятие</Button>
                    )}
                </div>
            ) : filteredLessons.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptyText}>Нет занятий в этой категории</p>
                </div>
            ) : (
                <div className={styles.lessonsList}>
                    {filteredLessons.map((lesson, index) => {
                        const subject = lesson.subject;
                        let lessonIsLocked = isLocked

                        if (lessonIsLocked && user?.proExpiresAt) {
                            if (new Date(lesson.date) <= new Date(user.proExpiresAt)) {
                                lessonIsLocked = false
                            }
                        }

                        return (
                            <div
                                key={lesson.id}
                                className={styles.lessonCard}
                                onClick={() => {
                                    if (lessonIsLocked && onLockedAction && !isStudentView) {
                                        onLockedAction("Для просмотра деталей занятия необходимо обновить подписку");
                                        return;
                                    }
                                    router.push(`/lessons/${lesson.slug || lesson.id}`)
                                }}
                            >
                                <div className={styles.lessonHeader}>
                                    <div>
                                        <div className={styles.lessonDateContainer}>

                                            {(lesson.group || lesson.groupName) && (!lesson.group || student.id !== lesson.group.id) && (
                                                <p className={styles.lessonGroupText}
                                                >
                                                    <span style={{ color: stringToColor(lesson.group?.name || lesson.groupName || '') }}>
                                                        {lesson.group?.name || lesson.groupName}
                                                    </span> <br className={styles.textBR} />- группа
                                                </p>
                                            )}
                                            <h3 className={styles.lessonDate}>
                                                {formatSmartDate(new Date(lesson.date))}
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span
                                                    className={styles.lessonTime}
                                                >
                                                    {getLessonTimeInfo(
                                                        new Date(lesson.date),
                                                        lesson.duration
                                                    )}
                                                </span>
                                                {isLessonOngoing(lesson.date, lesson.duration) && (
                                                    <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: 500 }}>
                                                        Занятие началось
                                                    </span>
                                                )}
                                            </div>
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
                                        <span className={`${styles.lessonPrice} ${lesson.price === 0 ? styles.priceFree : ''}`}>
                                            {lesson.price === 0 ? 'Бесплатно' : (
                                                <>
                                                    {isStudentView
                                                        ? lesson.price
                                                        : (lesson.group && lesson.lessonPayments
                                                            ? lesson.lessonPayments.filter(p => p.hasPaid).length * lesson.price
                                                            : lesson.price)} ₽
                                                </>
                                            )}
                                        </span>
                                        <LessonBadges
                                            price={lesson.price}
                                            isPaid={lesson.isPaid}
                                            isTrial={lesson.isTrial}
                                            isGroupLesson={!!lesson.group}
                                            totalStudents={lesson.group?.students?.length || 0}
                                            lessonPayments={lesson.lessonPayments}
                                            isStudentView={isStudentView}
                                        />
                                    </div>
                                </div>
                                <LessonLinkSection
                                    lesson={lesson}
                                    isStudentView={isStudentView}
                                    isLocked={lessonIsLocked}
                                    onLockedAction={onLockedAction}
                                />

                                <div onClick={(e) => e.stopPropagation()}>
                                    <LessonActions
                                        lesson={lesson}
                                        onTogglePaid={(l) => {
                                            if (l.group && onOpenGroupPayment) {
                                                onOpenGroupPayment(l)
                                            } else if (onTogglePaidStatus) {
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
                                        isStudentView={isStudentView}
                                        isLocked={lessonIsLocked}
                                        onLockedAction={onLockedAction}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
            }
        </div>
    );
}
