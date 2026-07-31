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
}

export const AccountDropdown: React.FC<AccountDropdownProps> = React.memo(
  function AccountDropdown({
    boundaryRef,
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
        <UserHeader user={user} />
        <div className="nines-dropdown-section">
          <div className="nines-dropdown-section-label">Account</div>
          <button
            type="button"
            className="nines-dropdown-item"
            onClick={() => onNavigate('Account')}
            role="menuitem"
          >
            <span>Account and verification</span>
          </button>
          <button
            type="button"
            className="nines-dropdown-item nines-dropdown-item--logout"
            onClick={onLogout}
            role="menuitem"
          >
            <span>Sign out</span>
          </button>
        </div>
      </div>
    )
  },
)
