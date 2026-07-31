import React from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { NinesLogo } from './NinesLogo'

export const PublicHeader: React.FC = React.memo(function PublicHeader() {
  const { authFlowError, isEnabled, login } = useAppAuth()
  const hasAuthError = isEnabled && Boolean(authFlowError)

  return (
    <header className="nines-header-shell">
      <div className="nines-header-frame">
        <div className="nines-header-primary-row nines-header-primary-row--single-line">
          <NinesLogo />
          {isEnabled ? (
            <div className="nines-header-actions">
              <button
                type="button"
                className="nines-header-button"
                onClick={() => void login()}
              >
                Sign in
              </button>
              <button
                type="button"
                className="nines-header-avatar"
                aria-label="Open account"
                onClick={() => {
                  window.location.hash = '#account'
                }}
              >
                A
              </button>
            </div>
          ) : null}
        </div>
        {hasAuthError ? (
          <div className="nines-auth-error" role="alert">
            Sign-in is temporarily unavailable. Please try again.
          </div>
        ) : null}
      </div>
    </header>
  )
})
