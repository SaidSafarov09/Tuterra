import React, { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { Student, Subject } from '@/types'

interface AddStudentModalProps {
    isOpen: boolean
    onClose: () => void
    subject: Subject | null
    allStudents: Student[]
    onSubmit: (mode: 'create' | 'link', data: any) => Promise<{ success: boolean }>
}

export function AddStudentModal({
    isOpen,
    onClose,
    subject,
    allStudents,
    onSubmit
}: AddStudentModalProps) {
    const [mode, setMode] = useState<'create' | 'link'>('link')
    const [selectedStudentId, setSelectedStudentId] = useState('')
    const [studentFormData, setStudentFormData] = useState({
        name: '',
        contact: '',
        note: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    React.useEffect(() => {
        if (isOpen) {
            setMode('link')
            setSelectedStudentId('')
            setStudentFormData({ name: '', contact: '', note: '' })
        }
    }, [isOpen])

    const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setStudentFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async () => {
        if (mode === 'create' && !studentFormData.name.trim()) {
            return
        }
        if (mode === 'link' && !selectedStudentId) {
            return
        }

        setIsSubmitting(true)
        const data = mode === 'create' ? studentFormData : { studentId: selectedStudentId }
        const result = await onSubmit(mode, data)
        setIsSubmitting(false)

        if (result.success) {
            onClose()
        }
    }

    const availableStudents = allStudents.filter(
        s => !s.subjects.some(subj => subj.id === subject?.id)
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Добавить ученика"
            size="large"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitText="Добавить"
                />
            }
        >
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => setMode('link')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: mode === 'link' ? 'var(--primary)' : 'transparent',
                                color: mode === 'link' ? 'white' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            Добавить существующего
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('create')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: mode === 'create' ? 'var(--primary)' : 'transparent',
                                color: mode === 'create' ? 'white' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            Создать нового
                        </button>
                    </div>
                </div>

                {mode === 'link' ? (
                    <Dropdown
                        label="Выберите ученика"
                        placeholder="Выберите ученика"
                        value={selectedStudentId}
                        onChange={(value) => setSelectedStudentId(value)}
                        options={availableStudents.map((student) => ({
                            value: student.id,
                            label: student.name,
                        }))}
                        searchable
                        required
                        disabled={isSubmitting}
                    />
                ) : (
                    <>
                        <Input
                            label="Имя"
                            name="name"
                            value={studentFormData.name}
                            onChange={handleStudentChange}
                            required
                            placeholder="Иван Иванов"
                            disabled={isSubmitting}
                        />
                        <Input
                            label="Контакт"
                            name="contact"
                            value={studentFormData.contact}
                            onChange={handleStudentChange}
                            placeholder="@telegram"
                            disabled={isSubmitting}
                        />
                        <Input
                            label="Заметка"
                            name="note"
                            value={studentFormData.note}
                            onChange={handleStudentChange}
                            placeholder="Дополнительная информация"
                            disabled={isSubmitting}
                        />
                    </>
                )}
            </form>
        </Modal>
    )
}
