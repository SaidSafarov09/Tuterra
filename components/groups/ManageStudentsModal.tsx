import React, { useState, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { groupsApi } from '@/services/api'
import { toast } from 'sonner'
import { useFetch } from '@/hooks/useFetch'
import { Group, Student } from '@/types'
import { Checkbox } from '@/components/ui/Checkbox'
import styles from './ManageStudentsModal.module.scss'

interface ManageStudentsModalProps {
    isOpen: boolean
    onClose: () => void
    group: Group
    onSuccess: () => void
}

export const ManageStudentsModal: React.FC<ManageStudentsModalProps> = ({
    isOpen,
    onClose,
    group,
    onSuccess
}) => {
    const [selectedStudents, setSelectedStudents] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { data: allStudents } = useFetch<Student[]>('/api/students')

    useEffect(() => {
        if (isOpen && group.students) {
            setSelectedStudents(group.students.map(s => s.id))
        }
    }, [isOpen, group.students])

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            await groupsApi.update(group.id, { studentIds: selectedStudents })
            toast.success('Участники обновлены')
            onSuccess()
        } catch (error) {
            toast.error('Не удалось обновить участников')
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

    const handleClose = () => {
        if (!isSubmitting) {
            onClose()
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Управление участниками"
            footer={
                <ModalFooter
                    onCancel={handleClose}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitText="Сохранить"
                />
            }
        >
            <div className={styles.content}>
                <p className={styles.description}>
                    Выберите учеников, которые будут участниками группы
                </p>

                {allStudents && allStudents.length > 0 ? (
                    <div className={styles.studentsList}>
                        {allStudents.map(student => (
                            <div
                                key={student.id}
                                className={styles.studentItem}
                                onClick={() => toggleStudent(student.id)}
                            >
                                <Checkbox
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => toggleStudent(student.id)}
                                />
                                <div className={styles.studentInfo}>
                                    <span className={styles.studentName}>{student.name}</span>
                                    {student.contact && (
                                        <span className={styles.studentContact}>{student.contact}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>Нет доступных учеников</p>
                    </div>
                )}

                <div className={styles.summary}>
                    Выбрано: {selectedStudents.length} {selectedStudents.length === 1 ? 'ученик' : selectedStudents.length < 5 ? 'ученика' : 'учеников'}
                </div>
            </div>
        </Modal>
    )
}
