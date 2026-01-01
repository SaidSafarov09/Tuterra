import React from 'react'
import styles from './MobileHeader.module.scss'
import { Logo } from '@/components/icons/Logo'
import { MenuIcon } from '@/components/icons/Icons'

interface MobileHeaderProps {
  title?: string
  onBurgerClick?: () => void
}

import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { ProBadge } from './ProBadge'

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onBurgerClick }) => {
  return (
    <header className={styles.mobileHeader}>
      <button
        className={styles.burgerButton}
        aria-label="Меню"
        onClick={onBurgerClick}
      >
        <MenuIcon size={28} />
      </button>
      <div className={styles.logoBlock}>
        <Logo size={28} />
        <ProBadge />
      </div>
      <div className={styles.actions}>
        <NotificationCenter />
      </div>
    </header>
  )
}
