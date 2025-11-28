'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon,
    ClockIcon,
    MoneyIcon,
    DeleteIcon,
    CheckIcon,
    XCircleIcon,
    PlusIcon
} from '@/components/icons/Icons'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    isPast,
    isFuture
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { formatSmartDate } from '@/lib/dateUtils'
import styles from './page.module.scss'

interface Lesson {
    id: string
    date: string
    price: number
    isPaid: boolean
    isCanceled: boolean
    notes?: string
    student: {
        id: string
        name: string
    }
    subject?: {
        id: string
        name: string
        color: string
    } | null
}

interface Student {
    id: string
    name: string
    subjects: {
        id: string
        name: string
        color: string
    }[]
}

interface Subject {
    id: string
    name: string
    color: string
}

interface DayData {
    lessons: Lesson[]
    totalEarned: number
    potentialEarnings: number
}

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [dayData, setDayData] = useState<DayData | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalView, setModalView] = useState<'details' | 'create'>('details')
    const [isLoadingDay, setIsLoadingDay] = useState(false)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Create Lesson State
    const [students, setStudents] = useState<Student[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        studentId: '',
        subjectId: '',
        date: new Date(),
        price: '',
        isPaid: false,
        notes: ''
    })

    useEffect(() => {
        fetchLessons()
        fetchStudents()
        fetchSubjects()
    }, [currentMonth])

    const fetchLessons = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/lessons')
            if (response.ok) {
                const data = await response.json()
                setLessons(data)
            } else {
                toast.error('Не удалось загрузить занятия')
            }
        } catch (error) {
            toast.error('Произошла ошибка при загрузке')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/students')
            if (response.ok) {
                const data = await response.json()
                setStudents(data)
            }
        } catch (error) {
            console.error('Failed to fetch students', error)
        }
    }

    const fetchSubjects = async () => {
        try {
            const response = await fetch('/api/subjects')
            if (response.ok) {
                const data = await response.json()
                setSubjects(data)
            }
        } catch (error) {
            console.error('Failed to fetch subjects', error)
        }
    }

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        loadDayData(date)
        setModalView('details')
        setIsModalOpen(true)
    }

    const handleCreateLesson = () => {
        if (!selectedDate) return

        // Set time to current time but keep the selected date
        const now = new Date()
        const initialDate = new Date(selectedDate)
        initialDate.setHours(now.getHours(), now.getMinutes())

        setFormData({
            studentId: '',
            subjectId: '',
            date: initialDate,
            price: '',
            isPaid: false,
            notes: ''
        })
        setError('')
        setModalView('create')
    }

    const handleBackToDetails = () => {
        setModalView('details')
        setError('')
    }

    const handleStudentChange = (studentId: string) => {
        const student = students.find(s => s.id === studentId)
        const preSelectedSubject = student?.subjects.length === 1 ? student.subjects[0].id : ''
        setFormData(prev => ({
            ...prev,
            studentId,
            subjectId: preSelectedSubject || prev.subjectId
        }))
    }

    const handleCreateStudent = async (name: string) => {
        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })

            if (!response.ok) {
                toast.error('Не удалось создать ученика')
                return
            }

            const newStudent = await response.json()
            await fetchStudents()
            setFormData(prev => ({ ...prev, studentId: newStudent.id }))
            toast.success(`Ученик "${name}" создан`)
        } catch (error) {
            toast.error('Ошибка при создании ученика')
        }
    }

    const handleCreateSubject = async (name: string) => {
        try {
            const colors = ['#4A6CF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
            const randomColor = colors[Math.floor(Math.random() * colors.length)]

            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color: randomColor }),
            })

            if (!response.ok) {
                toast.error('Не удалось создать предмет')
                return
            }

            const newSubject = await response.json()
            await fetchSubjects()
            setFormData(prev => ({ ...prev, subjectId: newSubject.id }))

            if (formData.studentId) {
                try {
                    await fetch(`/api/subjects/${newSubject.id}/students/link`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId: formData.studentId }),
                    })
                    await fetchStudents()
                } catch (error) {
                    console.error('Failed to link subject to student:', error)
                }
            }

            toast.success(`Предмет "${name}" создан`)
        } catch (error) {
            toast.error('Ошибка при создании предмета')
        }
    }

    const handleSubmitLesson = async () => {
        if (!formData.studentId || !formData.price) {
            toast.error('Заполните все обязательные поля')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const response = await fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: formData.studentId,
                    subjectId: formData.subjectId || undefined,
                    date: formData.date.toISOString(),
                    price: parseInt(formData.price),
                    isPaid: formData.isPaid,
                    notes: formData.notes
                }),
            })

            if (response.ok) {
                await fetchLessons()
                if (selectedDate) {
                    // We need to fetch the updated lessons list to update dayData correctly
                    // Since fetchLessons updates state asynchronously, we can't rely on 'lessons' state immediately here
                    // But we can manually update dayData with the new lesson if we want instant feedback
                    // Or just re-fetch everything.
                    // Let's just re-fetch lessons and then update day data.
                    // Actually, fetchLessons is async.
                    const newLessonsResponse = await fetch('/api/lessons')
                    const newLessons = await newLessonsResponse.json()
                    setLessons(newLessons)
                    updateDayData(newLessons, selectedDate)
                }

                setModalView('details')
                toast.success('Занятие успешно добавлено')
            } else {
                const data = await response.json()
                setError(data.error || 'Произошла ошибка')
            }
        } catch (error) {
            toast.error('Произошла ошибка при создании занятия')
            setError('Произошла ошибка при создании занятия')
        } finally {
            setIsSubmitting(false)
        }
    }

    const updateDayData = (currentLessons: Lesson[], date: Date) => {
        const dayLessons = currentLessons.filter(lesson =>
            isSameDay(new Date(lesson.date), date)
        )

        const totalEarned = dayLessons
            .filter(l => l.isPaid)
            .reduce((sum, l) => sum + l.price, 0)

        const potentialEarnings = dayLessons
            .filter(l => !l.isPaid && !l.isCanceled)
            .reduce((sum, l) => sum + l.price, 0)

        setDayData({
            lessons: dayLessons,
            totalEarned,
            potentialEarnings
        })
    }

    const loadDayData = (date: Date) => {
        setIsLoadingDay(true)
        updateDayData(lessons, date)
        setIsLoadingDay(false)
    }

    const handleToggleCancel = async (lesson: Lesson) => {
        try {
            const response = await fetch(`/api/lessons/${lesson.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCanceled: !lesson.isCanceled })
            })

            if (response.ok) {
                const updatedLesson = await response.json()

                // Update local state immediately
                const updatedLessons = lessons.map(l =>
                    l.id === lesson.id ? updatedLesson : l
                )
                setLessons(updatedLessons)

                if (selectedDate) {
                    updateDayData(updatedLessons, selectedDate)
                }

                toast.success(updatedLesson.isCanceled ? 'Занятие отменено' : 'Занятие восстановлено')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        }
    }

    const handleTogglePaid = async (lesson: Lesson) => {
        try {
            const response = await fetch(`/api/lessons/${lesson.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPaid: !lesson.isPaid })
            })

            if (response.ok) {
                const updatedLesson = await response.json()

                // Update local state immediately
                const updatedLessons = lessons.map(l =>
                    l.id === lesson.id ? updatedLesson : l
                )
                setLessons(updatedLessons)

                if (selectedDate) {
                    updateDayData(updatedLessons, selectedDate)
                }

                toast.success(updatedLesson.isPaid ? 'Отмечено как оплаченное' : 'Отмечено как неоплаченное')
            }
        } catch (error) {
            toast.error('Произошла ошибка')
        }
    }

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart, { locale: ru })
        const endDate = endOfWeek(monthEnd, { locale: ru })

        const dateFormat = 'd'
        const rows = []
        let days = []
        let day = startDate

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day
                const dayLessons = lessons.filter(lesson =>
                    isSameDay(new Date(lesson.date), cloneDay)
                )
                const hasLessons = dayLessons.length > 0
                const dayEarnings = dayLessons
                    .filter(l => l.isPaid)
                    .reduce((sum, l) => sum + l.price, 0)

                days.push(
                    <div
                        key={day.toString()}
                        className={`${styles.calendarDay} ${!isSameMonth(day, monthStart) ? styles.disabled : ''
                            } ${isSameDay(day, new Date()) ? styles.today : ''} ${hasLessons ? styles.hasLessons : ''
                            }`}
                        onClick={() => handleDateClick(cloneDay)}
                    >
                        <span className={styles.dayNumber}>{format(day, dateFormat)}</span>
                        {hasLessons && (
                            <div className={styles.dayIndicators}>
                                <div className={styles.subjectDots}>
                                    {dayLessons.slice(0, 4).map((lesson, idx) => (
                                        <div
                                            key={idx}
                                            className={styles.subjectDot}
                                            style={{ backgroundColor: lesson.subject?.color || 'var(--primary)' }}
                                        />
                                    ))}
                                    {dayLessons.length > 4 && (
                                        <div className={styles.moreDots}>+</div>
                                    )}
                                </div>
                                {dayEarnings > 0 && (
                                    <div className={styles.earnings}>+{dayEarnings}₽</div>
                                )}
                            </div>
                        )}
                    </div>
                )
                day = addDays(day, 1)
            }
            rows.push(
                <div className={styles.calendarWeek} key={day.toString()}>
                    {days}
                </div>
            )
            days = []
        }
        return <div className={styles.calendarBody}>{rows}</div>
    }

    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Календарь</h1>
                    <p className={styles.subtitle}>Планирование занятий</p>
                </div>
            </div>

            <div className={styles.calendarContainer}>
                <div className={styles.calendarHeader}>
                    <button
                        className={styles.navButton}
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                        <ChevronLeftIcon size={20} />
                    </button>
                    <h2 className={styles.monthTitle}>
                        {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                    </h2>
                    <button
                        className={styles.navButton}
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                        <ChevronRightIcon size={20} />
                    </button>
                </div>

                <div className={styles.calendarWeekDays}>
                    {weekDays.map(day => (
                        <div key={day} className={styles.weekDay}>
                            {day}
                        </div>
                    ))}
                </div>

                {renderCalendar()}
            </div>

            {/* Day Details Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalView === 'create' ? 'Добавить занятие' : (selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : '')}
                footer={
                    modalView === 'create' ? (
                        <ModalFooter
                            onCancel={handleBackToDetails}
                            onSubmit={handleSubmitLesson}
                            isLoading={isSubmitting}
                            submitText="Добавить"
                            cancelText="Назад"
                        />
                    ) : (
                        <div className={styles.modalFooter}>
                            <Button onClick={handleCreateLesson} className={styles.addLessonButton}>
                                <PlusIcon size={20} />
                                Добавить занятие
                            </Button>
                        </div>
                    )
                }
            >
                {modalView === 'create' ? (
                    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                        {error && <div style={{ color: 'var(--error)' }}>{error}</div>}

                        <Dropdown
                            label="Ученик"
                            placeholder="Выберите или создайте ученика"
                            value={formData.studentId}
                            onChange={handleStudentChange}
                            options={students.map((student) => ({
                                value: student?.id,
                                label: student.name,
                            }))}
                            searchable
                            creatable
                            onCreate={handleCreateStudent}
                            menuPosition="relative"
                            required
                            disabled={isSubmitting}
                        />

                        <Dropdown
                            label="Предмет"
                            placeholder="Выберите или создайте предмет"
                            value={formData.subjectId}
                            onChange={(value) => setFormData((prev) => ({ ...prev, subjectId: value }))}
                            options={subjects.map((subject) => ({
                                value: subject.id,
                                label: subject.name,
                            }))}
                            searchable
                            creatable
                            onCreate={handleCreateSubject}
                            menuPosition="relative"
                            disabled={isSubmitting}
                        />

                        <DateTimePicker
                            label="Время"
                            value={formData.date}
                            onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                            showTime
                            required
                            disabled={isSubmitting}
                            dropDirection="up"
                        />

                        <Input
                            label="Цена"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            required
                            placeholder="1000"
                            disabled={isSubmitting}
                        />

                        <Input
                            label="Заметки"
                            name="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Тема урока, домашнее задание..."
                            disabled={isSubmitting}
                        />

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                name="isPaid"
                                checked={formData.isPaid}
                                onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                                disabled={isSubmitting}
                                style={{ width: '18px', height: '18px' }}
                            />
                            Оплачено
                        </label>
                    </form>
                ) : (
                    <>
                        {isLoadingDay ? (
                            <div className={styles.modalLoading}>Загрузка...</div>
                        ) : dayData && (dayData.lessons.length > 0 || dayData.totalEarned > 0 || dayData.potentialEarnings > 0) ? (
                            <div className={styles.dayDetails}>
                                <div className={styles.dayStats}>
                                    {selectedDate && isPast(selectedDate) ? (
                                        <div className={styles.statCard}>
                                            <MoneyIcon size={24} color="#10B981" />
                                            <div>
                                                <div className={styles.statLabel}>Заработано</div>
                                                <div className={styles.statValue}>{dayData.totalEarned} ₽</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.statCard}>
                                            <MoneyIcon size={24} color="#6366f1" />
                                            <div>
                                                <div className={styles.statLabel}>Возможный заработок</div>
                                                <div className={styles.statValue}>
                                                    {dayData.totalEarned + dayData.potentialEarnings} ₽
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {dayData.lessons.length > 0 ? (
                                    <div className={styles.lessonsList}>
                                        <h3 className={styles.lessonsTitle}>Занятия {dayData.lessons.length}</h3>
                                        {dayData.lessons.map(lesson => (
                                            <div
                                                key={lesson.id}
                                                className={`${styles.lessonCard} ${lesson.isCanceled ? styles.lessonCanceled : ''}`}
                                            >
                                                <div className={styles.lessonMain}>
                                                    <div className={styles.lessonInfo}>
                                                        <div className={styles.lessonStudent}>
                                                            {lesson.student.name}
                                                            {lesson.isCanceled && (
                                                                <span className={styles.canceledBadge}>Отменено</span>
                                                            )}
                                                        </div>
                                                        <div className={styles.lessonMeta}>
                                                            <ClockIcon size={14} />
                                                            {format(new Date(lesson.date), 'HH:mm')}
                                                            {lesson.subject && (
                                                                <span
                                                                    className={styles.lessonSubject}
                                                                    style={{
                                                                        color: lesson.subject.color,
                                                                        backgroundColor: `${lesson.subject.color}20`
                                                                    }}
                                                                >
                                                                    {lesson.subject.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {lesson.notes && (
                                                            <div className={styles.lessonNotes}>{lesson.notes}</div>
                                                        )}
                                                    </div>
                                                    <div className={styles.lessonPrice}>
                                                        <div className={`${styles.price} ${lesson.isPaid ? styles.pricePaid : styles.priceUnpaid}`}>
                                                            {lesson.price} ₽
                                                        </div>
                                                        {lesson.isPaid && (
                                                            <span className={styles.paidBadge}>Оплачено</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.lessonActions}>
                                                    <button
                                                        className={styles.actionButton}
                                                        onClick={() => handleTogglePaid(lesson)}
                                                        disabled={lesson.isCanceled}
                                                    >
                                                        <CheckIcon size={16} />
                                                        {lesson.isPaid ? 'Отменить оплату' : 'Отметить оплаченным'}

                                                    </button>

                                                    {!isPast(new Date(lesson.date)) && (
                                                        <button
                                                            className={`${styles.actionButton} ${lesson.isCanceled ? styles.restoreButton : styles.deleteButton}`}
                                                            onClick={() => handleToggleCancel(lesson)}
                                                            title={lesson.isCanceled ? 'Восстановить' : 'Отменить'}
                                                        >
                                                            {lesson.isCanceled ? <CheckIcon size={16} /> : <XCircleIcon size={16} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.emptyDay}>
                                        <p>Нет занятий</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.emptyDay}>
                                <CalendarIcon size={48} color="#9CA3AF" />
                                <p>Нет занятий на этот день</p>
                            </div>
                        )}
                    </>
                )}
            </Modal>
        </div>
    )
}
