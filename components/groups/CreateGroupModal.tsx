import React, { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { groupsApi } from '@/services/api'
import { toast } from 'sonner'
import { useFetch } from '@/hooks/useFetch'
import { Student, Subject } from '@/types'
import { Checkbox } from '@/components/ui/Checkbox'
import styles from './CreateGroupModal.module.scss'

interface CreateGroupModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [name, setName] = useState('')
    const [note, setNote] = useState('')
    const [selectedStudents, setSelectedStudents] = useState<string[]>([])
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { data: students } = useFetch<Student[]>('/api/students')
    const { data: subjects } = useFetch<Subject[]>('/api/subjects')

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('Введите название группы')
            return
        }

        setIsSubmitting(true)
        try {
            await groupsApi.create({
                name: name.trim(),
                studentIds: selectedStudents,
                subjectIds: selectedSubjects,
                note: note.trim() || undefined
            })
            toast.success('Группа создана')
            setName('')
            setNote('')
            setSelectedStudents([])
            setSelectedSubjects([])
            onSuccess()
        } catch (error) {
            toast.error('Не удалось создать группу')
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    const toggleSubject = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        )
    }

    const handleClose = () => {
        if (!isSubmitting) {
            setName('')
            setNote('')
            setSelectedStudents([])
            setSelectedSubjects([])
            onClose()
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Создать группу"
            footer={
                <ModalFooter
                    onCancel={handleClose}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitText="Создать"
                />
            }
        >
            <div className={styles.content}>
                <Input
                    label="Название группы"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: Математика 10 класс"
                    disabled={isSubmitting}
                    required
                />

                <Input
                    label="Заметка (необязательно)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Дополнительная информация о группе"
                    disabled={isSubmitting}
                />

                {subjects && subjects.length > 0 && (
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>
                            Предметы (необязательно)
                        </label>
                        <div className={styles.subjectsList}>
                            {subjects.map(subject => (
                                <div
                                    key={subject.id}
                                    className={styles.subjectItem}
                                    onClick={() => toggleSubject(subject.id)}
                                >
                                    <Checkbox
                                        checked={selectedSubjects.includes(subject.id)}
                                        onChange={() => toggleSubject(subject.id)}
                                    />
                                    <div
                                        className={styles.subjectColor}
                                        style={{ backgroundColor: subject.color }}
                                    />
                                    <span className={styles.subjectName}>{subject.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {students && students.length > 0 && (
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>
                            Ученики (необязательно)
                        </label>
                        <div className={styles.studentsList}>
                            {students.map(student => (
                                <div
                                    key={student.id}
                                    className={styles.studentItem}
                                    onClick={() => toggleStudent(student.id)}
                                >
                                    <Checkbox
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                    />
                                    <span className={styles.studentName}>{student.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}
