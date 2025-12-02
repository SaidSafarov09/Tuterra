import React, { useState, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ColorPicker } from '@/components/ui/ColorPicker'

interface SubjectFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { name: string; color: string }) => Promise<{ success: boolean; error?: string }>
    title: string
    submitText: string
    initialData?: { name: string; color: string }
}

export function SubjectFormModal({
    isOpen,
    onClose,
    onSubmit,
    title,
    submitText,
    initialData = { name: '', color: '#4A6CF7' }
}: SubjectFormModalProps) {
    const [formData, setFormData] = useState(() => ({ ...initialData }))
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            setFormData({ ...initialData })
            setError('')
        }
    }, [isOpen, initialData.name, initialData.color])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('Введите название предмета')
            return
        }

        setIsSubmitting(true)
        setError('')

        const result = await onSubmit(formData)

        setIsSubmitting(false)

        if (result.success) {
            onClose()
        } else if (result.error) {
            setError(result.error)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitText={submitText}
                />
            }
        >
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {error && <div style={{ color: 'var(--error)' }}>{error}</div>}

                <Input
                    label="Название предмета"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Математика, Английский язык"
                    disabled={isSubmitting}
                />

                <div>
                    <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                        Цвет
                    </label>
                    <ColorPicker
                        value={formData.color}
                        onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
                    />
                </div>
            </form>
        </Modal>
    )
}