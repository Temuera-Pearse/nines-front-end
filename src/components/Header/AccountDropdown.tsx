import React, { useEffect, useRef } from 'react'

interface AccountDropdownProps {
  boundaryRef: React.RefObject<HTMLDivElement>
  isOpen: boolean
  onClose: () => void
  onNavigate: (target: string) => void
  onLogout: () => void
}

const MENU_ITEMS = [
  'Wallet',
  'Vault',
  'Transactions',
  'My Bets',
  'Settings',
] as const

export const AccountDropdown: React.FC<AccountDropdownProps> = React.memo(
  function AccountDropdown({
    boundaryRef,
    isOpen,
    onClose,
    onNavigate,
    onLogout,
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
        {MENU_ITEMS.map((item) => (
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
        <button
          type="button"
          className="nines-dropdown-item nines-dropdown-item--logout"
          onClick={onLogout}
          role="menuitem"
        >
          <span>Logout</span>
        </button>
      </div>
    )
  },
)
