import React from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { HeaderRaceTimer } from './HeaderRaceTimer'
import { NinesLogo } from './NinesLogo'

export const PublicHeader: React.FC = React.memo(function PublicHeader() {
  const { authFlowError, isEnabled, playerVerificationError } = useAppAuth()
  const visibleAuthError = isEnabled
    ? authFlowError ?? playerVerificationError
    : null

  return (
    <header className="nines-header-shell">
      <div className="nines-header-frame">
        <div className="nines-header-primary-row nines-header-primary-row--single-line">
          <NinesLogo />

          <div className="nines-header-public-race-row">
            <HeaderRaceTimer />
          </div>
        </div>
        {visibleAuthError ? (
          <div className="nines-auth-error" role="alert">
            Nines service unavailable: {visibleAuthError}
          </div>
        ) : null}
      </div>
    </header>
  )
})
