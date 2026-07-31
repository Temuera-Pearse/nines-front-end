import React, { useEffect, useRef, useState } from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { PlayerAccountPanel } from './PlayerAccountPanel'

function isAccountHash(): boolean {
  return window.location.hash === '#account'
}

export const AccountDrawer: React.FC = () => {
  const { auth0SessionIsAuthenticated, isEnabled, login, signup } = useAppAuth()
  const [isOpen, setIsOpen] = useState(isAccountHash)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const handleHashChange = () => setIsOpen(isAccountHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        window.location.hash = '#race'
      }
      if (event.key !== 'Tab') return
      const drawer = closeButtonRef.current?.closest('[role="dialog"]')
      const focusable = drawer?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  if (!isEnabled || !isOpen) return null

  const close = () => {
    window.location.hash = '#race'
  }

  return (
    <div className="nines-account-overlay">
      <button
        type="button"
        className="nines-account-backdrop"
        aria-label="Close account panel"
        onClick={close}
      />
      <aside
        className="nines-account-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nines-account-title"
      >
        <div className="nines-account-drawer__header">
          <h2 id="nines-account-title">Account</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="nines-account-close"
            aria-label="Close account panel"
            onClick={close}
          >
            ×
          </button>
        </div>
        <div className="nines-account-drawer__body">
          {auth0SessionIsAuthenticated ? (
            <PlayerAccountPanel />
          ) : (
            <div className="nines-account-auth">
              <h3>Sign in to view your account</h3>
              <p>
                Race viewing remains available without signing in. Player and
                KYC endpoints are called only after authentication.
              </p>
              <button
                type="button"
                className="nines-account-action nines-account-action--primary"
                onClick={() => void login()}
              >
                Sign in
              </button>
              <button
                type="button"
                className="nines-account-action"
                onClick={() => void signup()}
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
