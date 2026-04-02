import React, { useRef, useState } from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { AccountDropdown } from './AccountDropdown'
import { NinesLogo } from './NinesLogo'

const MENU_HASHES: Record<string, string> = {
  Wallet: '#wallet',
  Vault: '#vault',
  Transactions: '#transactions',
  'My Bets': '#my-bets',
  Settings: '#settings',
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'N'
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}

export const AppHeader: React.FC = React.memo(function AppHeader() {
  const { logout, user } = useAppAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuBoundaryRef = useRef<HTMLDivElement | null>(null)
  const displayName = user?.name ?? 'Nines Player'

  const handleNavigate = (target: string) => {
    const hash = MENU_HASHES[target]
    if (hash) {
      window.location.hash = hash
    }
    setIsMenuOpen(false)
  }

  const handleWalletClick = () => {
    window.location.hash = '#wallet'
  }

  const handleLogout = () => {
    setIsMenuOpen(false)
    logout()
  }

  return (
    <header className="nines-header-shell">
      <div className="nines-header-frame">
        <NinesLogo />

        <div className="nines-header-center">
          <div className="nines-balance-pill" aria-label="Account balance">
            <span className="nines-balance-label">Balance</span>
            <span className="nines-balance-value">AU$0.00</span>
          </div>

          <button
            type="button"
            className="nines-header-menu-button"
            onClick={handleWalletClick}
          >
            Wallet
          </button>
        </div>

        <div className="nines-header-actions">
          <div className="nines-account-menu" ref={menuBoundaryRef}>
            <button
              type="button"
              className="nines-header-avatar"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label={`${displayName} account menu`}
            >
              {getInitials(displayName)}
            </button>

            <AccountDropdown
              boundaryRef={menuBoundaryRef}
              balancePreview="Available balance AU$0.00"
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              user={user}
            />
          </div>
        </div>
      </div>
    </header>
  )
})
