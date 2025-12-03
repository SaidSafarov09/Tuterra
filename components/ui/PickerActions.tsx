'use client'

import React from 'react'
import styles from './DateTimePicker.module.scss'
import { Button } from './Button'

interface PickerActionsProps {
  onCancel: () => void
  onConfirm: () => void
 cancelText?: string
  confirmText?: string
  className?: string
}

export const PickerActions: React.FC<PickerActionsProps> = ({ 
  onCancel, 
  onConfirm, 
  cancelText = 'Отмена', 
  confirmText = 'Готово',
  className = ''
}) => {
  return (
    <div className={`${styles.footer} ${className}`}>
      <Button variant="ghost" size="small" fullWidth onClick={onCancel}>
        {cancelText}
      </Button>
      <Button size="small" fullWidth onClick={onConfirm}>
        {confirmText}
      </Button>
    </div>
  )
}