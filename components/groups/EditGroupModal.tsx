import React, { useState, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { groupsApi } from '@/services/api'
import { toast } from 'sonner'
import { Group } from '@/types'

interface EditGroupModalProps {
    isOpen: boolean
    onClose: () => void
    group: Group
    onSuccess: () => void
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
    isOpen,
    onClose,
    group,
    onSuccess
}) => {
    const [name, setName] = useState(group.name)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setName(group.name)
        }
    }, [isOpen, group.name])

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('Введите название группы')
            return
        }

        if (name.trim() === group.name) {
            onClose()
            return
        }

        setIsSubmitting(true)
        try {
            await groupsApi.update(group.id, { name: name.trim() })
            toast.success('Группа обновлена')
            onSuccess()
        } catch (error) {
            toast.error('Не удалось обновить группу')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Редактировать группу"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    submitText="Сохранить"
                />
            }
        >
            <Input
                label="Название группы"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Математика 10 класс"
                disabled={isSubmitting}
                required
            />
        </Modal>
    )
}
