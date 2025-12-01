import React, { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Student } from '@/types'

interface CreateLessonModalProps {
    isOpen: boolean
    onClose: () => void
    students: Student[]
    onSubmit: (data: {
        studentId: string
        date: Date
        price: string
        isPaid: boolean
    }) => Promise<{ success: boolean }>
}

export function CreateLessonModal({
    isOpen,
    onClose,
    students,
    onSubmit
}: CreateLessonModalProps) {
    const [formData, setFormData] = useState({
        studentId: '',
        date: new Date(),
        price: '',
        isPaid: false,
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    React.useEffect(() => {
        if (isOpen) {
            setFormData({ studentId: '', date: new Date(), price: '', isPaid: false })
        }
    }, [isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSubmit = async () => {
        if (!formData.studentId || !formData.price) {
            return
        }

        setIsSubmitting(true)
        const result = await onSubmit(formData)
        setIsSubmitting(false)

        if (result.success) {
            onClose()
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Создать занятие"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitText="Создать"
                />
            }
        >
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Dropdown
                    label="Ученик"
                    placeholder="Выберите ученика"
                    value={formData.studentId}
                    onChange={(value) => setFormData((prev) => ({ ...prev, studentId: value }))}
                    options={students.map((student) => ({
                        value: student.id,
                        label: student.name,
                    }))}
                    searchable
                    required
                    disabled={isSubmitting}
                />

                <DateTimePicker
                    label="Дата и время"
                    value={formData.date}
                    onChange={(date) => setFormData((prev) => ({ ...prev, date }))}
                    showTime
                    required
                    disabled={isSubmitting}
                />

                <Input
                    label="Цена"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    placeholder="1000"
                    disabled={isSubmitting}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="checkbox"
                        name="isPaid"
                        checked={formData.isPaid}
                        onChange={handleChange}
                        disabled={isSubmitting}
                    />
                    Оплачено
                </label>
            </form>
        </Modal>
    )
}
