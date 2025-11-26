import { create } from 'zustand'

interface ModalStore {
    isOpen: boolean
    mode: 'create' | 'edit'
    data: any
    openModal: (mode: 'create' | 'edit', data?: any) => void
    closeModal: () => void
}

export const useModalStore = create<ModalStore>((set) => ({
    isOpen: false,
    mode: 'create',
    data: null,
    openModal: (mode, data = null) => set({ isOpen: true, mode, data }),
    closeModal: () => set({ isOpen: false, data: null }),
}))
