import React from 'react'
import styles from './MobileHeader.module.scss'
import { Logo } from '@/components/icons/Logo'
import { MenuIcon } from '@/components/icons/Icons'

interface MobileHeaderProps {
  title?: string
  onBurgerClick?: () => void
}

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
      </div>
    </header>
  )
}
