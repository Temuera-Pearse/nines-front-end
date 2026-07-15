import React from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { HeaderRaceTimer } from './HeaderRaceTimer'
import { NinesLogo } from './NinesLogo'

export const PublicHeader: React.FC = React.memo(function PublicHeader() {
  const { authFlowError, isEnabled, login, playerVerificationError, signup } =
    useAppAuth()
  const visibleAuthError = authFlowError ?? playerVerificationError

  return (
    <header className="nines-header-shell">
      <div className="nines-header-frame">
        <div className="nines-header-primary-row nines-header-primary-row--single-line">
          <NinesLogo />

          <div className="nines-header-public-race-row">
            <HeaderRaceTimer />
          </div>

          <div className="nines-header-actions">
            <button
              type="button"
              className="nines-header-button nines-header-button--secondary"
              onClick={() => {
                void login()
              }}
              disabled={!isEnabled}
            >
              Login
            </button>
            <button
              type="button"
              className="nines-header-button nines-header-button--primary"
              onClick={() => {
                void signup()
              }}
              disabled={!isEnabled}
            >
              Register
            </button>
          </div>
        </div>
        {visibleAuthError ? (
          <div className="nines-auth-error" role="alert">
            Login unavailable: {visibleAuthError}
          </div>
        ) : null}
      </div>
    </header>
  )
})
