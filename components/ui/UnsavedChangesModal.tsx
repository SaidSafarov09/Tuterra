import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import styles from './UnsavedChangesModal.module.scss'

interface UnsavedChangesModalProps {
    isOpen: boolean
    onClose: () => void
    onDiscard: () => void
}

export function UnsavedChangesModal({ isOpen, onClose, onDiscard }: UnsavedChangesModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className={styles.content}>
                <div className={styles.icon}>
                    <AlertTriangle size={48} />
                </div>
                <h2 className={styles.title}>Несохраненные изменения</h2>
                <p className={styles.message}>
                    У вас есть несохраненные изменения. Если вы покинете страницу, все изменения будут потеряны.
                </p>
                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onClose}>
                        Остаться на странице
                    </Button>
                    <Button variant="danger" onClick={onDiscard}>
                        Покинуть без сохранения
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
