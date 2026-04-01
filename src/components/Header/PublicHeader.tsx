import React from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { NinesLogo } from './NinesLogo'

export const PublicHeader: React.FC = React.memo(function PublicHeader() {
  const { isEnabled, login, signup } = useAppAuth()

  return (
    <header className="nines-header-shell">
      <div className="nines-header-frame">
        <NinesLogo />

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
    </header>
  )
})
