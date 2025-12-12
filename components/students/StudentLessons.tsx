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
        let filtered = [];

        switch (activeTab) {
            case "upcoming":
                filtered = lessons.filter((l) => !l.isCanceled && new Date(l.date) >= now);
                return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ascending (Nearest first)
            case "past":
                filtered = lessons.filter((l) => !l.isCanceled && new Date(l.date) < now);
                return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Descending (Recent first)
            case "unpaid":
                filtered = lessons.filter((l) => {
                    if (l.isCanceled || l.price === 0) return false;

                    // Check group payment status
                    if (l.group) {
                        const paidCount = l.lessonPayments ? l.lessonPayments.filter(p => p.hasPaid).length : 0;
                        const totalStudents = l.group.students ? l.group.students.length : 0;

                        // If fully paid, exclude from unpaid list
                        if (totalStudents > 0 && paidCount >= totalStudents) return false;

                        // If we are on Student page (l.student is defined and matches current student?), 
                        // usually StudentLessons shows lessons FOR THE STUDENT.
                        // If it's a group lesson, does the STUDENT have to pay?
                        // The logic passes `lessons` prop.
                        // If we are on Group Detail Page, we want to know if the GROUP lesson is unpaid (anyone owes).
                        // My logic above checks if ANYONE owes (paidCount < total). Correct.

                        // If we are on Student Detail Page viewing a Group Lesson:
                        // The user might only care if THIS student paid.
                        // But the filter `unpaid` usually refers to the Lesson status or the Student's obligation?
                        // The user complaint was "paid group lessons lie in unpaid tabs".
                        // This implies they show up when they shouldn't.

                        // If I use the logic "paidCount < totalStudents", it means "Partially paid is Unpaid". This is standard.
                        // If "All Paid", it returns false (excluded).

                        // However, for Student Detail Page, specifically for Group Lessons:
                        // We constructed `isPaid` manually in page.tsx: `isPaid: payment ? payment.hasPaid : false`.
                        // So checking `l.isPaid` might be enough IF `l.isPaid` was correctly reduced for the context.

                        // BUT! The `lessons` prop passed to `StudentLessons` contains `isPaid` property.
                        // In `StudentDetailPage`, we manually set `isPaid` based on THE STUDENT'S payment status (Line 140 of page.tsx).
                        // So if we trust `l.isPaid`, it should work for Student Page.

                        // BUT for Group Detail Page (which reuses StudentLessons), `isPaid` on lesson might be the raw Lesson.isPaid (false).
                        // In `GroupDetailPage`, we map lessons: lines 84-88. We do NOT override `isPaid`.
                        // So for Group Page, `isPaid` is the DB flag (false for groups often).
                        // So we NEED the detailed check for Group Page.
                        // And for Student Page? `l.group` is present.
                        // If I use detailed check: `paidCount < total`.
                        // On Student Page, `l.lessonPayments` might be just `[payment for student]`?
                        // In `page.tsx`: 
                        // `l` comes from `g.lessons`. `g.lessons` has `lessonPayments`?
                        // The include in `api/students/[id]` (Step 1455) was `groups: { include: { lessons: { include: { lessonPayments: true } } } }`?
                        // I need to verify if `lessonPayments` includes ALL payments or just student's.
                        // Usually includes all if not filtered.
                        // If it includes all, then calculating `paidCount` works for "Whole Group Status".
                        // But if we are on Student Page, "Unpaid" might mean "THIS Student hasn't paid".
                        // In Student Page mapping (line 140): `isPaid` IS reliable for "This Student".

                        // CONFLICT:
                        // Group Page: `isPaid` is unreliable (DB flag). Need `paidCount`.
                        // Student Page: `isPaid` is reliable (Calculated for student). `paidCount` checks GROUP status.

                        // If I use `paidCount` check on Student Page, I might hide a lesson where THIS student paid but OTHERS didn't?
                        // Start: Student paid. Others didn't. `paidCount < total`. Filter says "Unpaid" (keep).
                        // But student PAID. So it should be in "Past/Upcoming" but NOT "Unpaid".
                        // So on Student Page, we want to exclude it if `l.isPaid` is true (User paid).

                        // Solution: Check `l.isPaid`.
                        // In Group Page, `l.isPaid` is false.
                        // In Student Page, `l.isPaid` is true (if paid).

                        // So: `if (l.isPaid) return false;`
                        // This handles Student Page correctly (assuming `isPaid` is set correctly).
                        // AND handles Group Page (if I fix mapping there? or if I use OR).

                        // If Group Page: `isPaid` is false.
                        // We fail first check.
                        // Then we check `paidCount >= total`. If so, return false (fully paid).

                        // So checking BOTH is safe?
                        // `if (l.isPaid) return false;`
                        // `if (l.group && ... paidCount >= total) return false;`

                        // Case: Student Page. Student Paid. Others Unpaid.
                        // `l.isPaid` = true. Return false (excluded from Unpaid). Correct.

                        // Case: Student Page. Student Unpaid. Others Paid.
                        // `l.isPaid` = false.
                        // `paidCount` (others) might be high.
                        // But `l.lessonPayments` contains THIS student's payment (unpaid).

                        // Wait, on Student Page, `l.lessonPayments` might strictly be the list from API.
                        // If `isPaid` is manually set, we should rely on it?
                        // But we can't distinguish Group Page vs Student Page easily inside component unless we verify props.
                        // But `l.isPaid` should be the truth for "Display as Paid".

                        // So I should ensure Group Page sets `isPaid` correctly too!
                        // In `GroupDetailPage`:
                        // `lessons.map(l => ({ ...l, group: ... }))`.
                        // I should Override `isPaid` there too!
                        // `isPaid = l.isPaid || (all students paid)`.

                        // IF I do that in `GroupDetailPage`, then `StudentLessons` logic `!l.isPaid` works for both!
                        // That is cleaner.

                        // BUT I already wrote the filter update plan for `StudentLessons`.
                        // Doing it in `GroupDetail` means editing `app/(dashboard)/groups/[id]/page.tsx`.
                        // Doing it in `StudentLessons` means handling it centrally.
                        // Since `StudentLessons` calculates Price and Badges based on `lessonPayments`, it knows about "Group Logic".
                        // So it should handle Filtering too.

                        // Revised Logic for `StudentLessons`:
                        if (l.isPaid) return false;
                        if (l.group && l.group.students && l.lessonPayments) {
                            const paidCount = l.lessonPayments.filter(p => p.hasPaid).length;
                            const total = l.group.students.length;
                            if (total > 0 && paidCount >= total) return false;
                        }
                        return true;
                    }
                    if (l.isPaid) return false;
                    return true;
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
                                                <span className={styles.lessonGroupText}>
                                                    {lesson.group.name} - группа
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
