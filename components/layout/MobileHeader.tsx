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
import { UserMobileMenu } from '@/components/user/UserMobileMenu'
import { useAuthStore } from '@/store/auth'
import { Crown } from 'lucide-react'
import { UpgradeToProModal } from '@/components/pro/UpgradeToProModal'

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onBurgerClick }) => {
  const { user } = useAuthStore()
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false)

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
        {!(user?.isPro || user?.plan === 'pro') && (
          <button
            className={styles.proButton}
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            <span>PRO</span>
          </button>
        )}
        <NotificationCenter />
        <UserMobileMenu />
      </div>

      <UpgradeToProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        limitType="general"
      />
    </header>
  )
}
