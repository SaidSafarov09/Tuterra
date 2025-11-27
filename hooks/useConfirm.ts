import { useState } from 'react'

interface ConfirmOptions {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
}

export const useConfirm = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [options, setOptions] = useState<ConfirmOptions>({
        title: '',
        message: '',
    })
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

    const confirm = (opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts)
        setIsOpen(true)

        return new Promise((resolve) => {
            setResolvePromise(() => resolve)
        })
    }

    const handleConfirm = () => {
        if (resolvePromise) {
            resolvePromise(true)
        }
        setIsOpen(false)
    }

    const handleCancel = () => {
        if (resolvePromise) {
            resolvePromise(false)
        }
        setIsOpen(false)
    }

    return {
        isOpen,
        options,
        confirm,
        handleConfirm,
        handleCancel,
    }
}
