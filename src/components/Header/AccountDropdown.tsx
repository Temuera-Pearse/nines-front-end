import React, { useEffect, useRef } from 'react'
import { AppAuthUser } from '../../auth/AppAuthProvider'
import { UserHeader } from './UserHeader'

interface AccountDropdownProps {
  boundaryRef: React.RefObject<HTMLDivElement>
  isOpen: boolean
  onClose: () => void
  onNavigate: (target: string) => void
  onLogout: () => void
  user: AppAuthUser | null
  balancePreview?: string
}

const MENU_SECTIONS = [
  {
    id: 'money',
    title: 'Money',
    items: ['Add Funds', 'Vault', 'Transactions'],
  },
  {
    id: 'activity',
    title: 'Activity',
    items: ['My Bets'],
  },
  {
    id: 'account',
    title: 'Account',
    items: ['Settings'],
  },
] as const

export const AccountDropdown: React.FC<AccountDropdownProps> = React.memo(
  function AccountDropdown({
    boundaryRef,
    balancePreview,
    isOpen,
    onClose,
    onNavigate,
    onLogout,
    user,
  }) {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
      if (!isOpen) return undefined

      const handlePointerDown = (event: MouseEvent) => {
        if (
          boundaryRef.current &&
          !boundaryRef.current.contains(event.target as Node)
        ) {
          onClose()
        }
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('mousedown', handlePointerDown)
      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('mousedown', handlePointerDown)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }, [boundaryRef, isOpen, onClose])

    if (!isOpen) return null

    return (
      <div className="nines-dropdown" ref={containerRef} role="menu">
        <UserHeader user={user} balancePreview={balancePreview} />

        {MENU_SECTIONS.map((section, sectionIndex) => (
          <React.Fragment key={section.id}>
            <div className="nines-dropdown-section">
              <div className="nines-dropdown-section-label">
                {section.title}
              </div>
              {section.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="nines-dropdown-item"
                  onClick={() => onNavigate(item)}
                  role="menuitem"
                >
                  <span>{item}</span>
                </button>
              ))}
              {section.id === 'account' ? (
                <button
                  type="button"
                  className="nines-dropdown-item nines-dropdown-item--logout"
                  onClick={onLogout}
                  role="menuitem"
                >
                  <span>Logout</span>
                </button>
              ) : null}
            </div>

            {sectionIndex < MENU_SECTIONS.length - 1 ? (
              <div className="nines-dropdown-divider" aria-hidden="true" />
            ) : null}
          </React.Fragment>
        ))}
      </div>
    )
  },
)
