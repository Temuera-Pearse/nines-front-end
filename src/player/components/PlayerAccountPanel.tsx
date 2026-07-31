import React from 'react'
import { accountErrorMessage, NinesApiError } from '../../api/apiError'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { KycStatusCard } from '../../kyc/components/KycStatusCard'
import { useKycProfile } from '../../kyc/hooks/useKycProfile'
import { useStartKycSession } from '../../kyc/hooks/useStartKycSession'
import { AccountStatusBadge } from './AccountStatusBadge'
import { useCurrentPlayer } from '../hooks/useCurrentPlayer'

export const PlayerAccountPanel: React.FC = () => {
  const { login, logout } = useAppAuth()
  const player = useCurrentPlayer()
  const kyc = useKycProfile()
  const startKyc = useStartKycSession()

  if (player.status === 'loading' || player.status === 'idle') {
    return (
      <div className="nines-account-panel" aria-busy="true" aria-live="polite">
        <div className="nines-account-skeleton" />
        <div className="nines-account-skeleton" />
        <span className="sr-only">Loading player account</span>
      </div>
    )
  }

  if (player.status !== 'success' || !player.data) {
    const correlationId =
      player.error instanceof NinesApiError
        ? player.error.correlationId
        : null
    return (
      <div className="nines-account-panel">
        <div className="nines-inline-error" role="alert">
          <h3>Account unavailable</h3>
          <p>{accountErrorMessage(player.error)}</p>
          {correlationId ? <p>Reference: {correlationId}</p> : null}
        </div>
        <div className="nines-card-actions">
          <button
            type="button"
            className="nines-account-action nines-account-action--primary"
            onClick={() =>
              player.status === 'unauthenticated'
                ? void login()
                : void player.refresh()
            }
          >
            {player.status === 'unauthenticated' ? 'Sign in again' : 'Try again'}
          </button>
          <button
            type="button"
            className="nines-account-action"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  const currentPlayer = player.data
  const identity =
    currentPlayer.displayName ?? currentPlayer.email ?? 'Nines player'

  return (
    <div className="nines-account-panel">
      <section className="nines-account-summary">
        <span className="nines-card-eyebrow">Player account</span>
        <h2>{identity}</h2>
        {currentPlayer.displayName && currentPlayer.email ? (
          <p>{currentPlayer.email}</p>
        ) : null}
        <AccountStatusBadge
          status={currentPlayer.accountStatus}
          showExplanation
        />
      </section>

      {kyc.isEnabled ? (
        <KycStatusCard
          profile={kyc.data}
          fallbackStatus={currentPlayer.kycStatus}
          canStart={currentPlayer.permissions.startKyc === true}
          isLoading={kyc.status === 'idle' || kyc.status === 'loading'}
          isRefreshing={kyc.isRefreshing}
          isStarting={startKyc.isLoading}
          error={kyc.error}
          startError={startKyc.error}
          popupStatus={startKyc.popupStatus}
          popupError={startKyc.popupError}
          onRefresh={() => void kyc.refresh()}
          onStart={() => void startKyc.startOrResume().catch(() => undefined)}
          onResume={() => {
            if (!kyc.data?.currentSession) return
            void startKyc
              .openSession(kyc.data.currentSession)
              .catch(() => undefined)
          }}
        />
      ) : (
        <section className="nines-kyc-card">
          <h3>Identity verification</h3>
          <p>KYC details are disabled for this deployment.</p>
        </section>
      )}

      <section className="nines-feature-card">
        <span className="nines-card-eyebrow">Feature availability</span>
        <h3>Current access</h3>
        <ul>
          <li>
            Race viewing:{' '}
            {currentPlayer.permissions.viewRaces ? 'available' : 'unavailable'}
          </li>
          <li>
            Profile management:{' '}
            {currentPlayer.permissions.manageProfile
              ? 'eligible when the feature launches'
              : 'unavailable'}
          </li>
          <li>
            Practice features:{' '}
            {currentPlayer.permissions.usePracticeBalance
              ? 'eligible when the feature launches'
              : 'unavailable'}
          </li>
        </ul>
        <p className="nines-unavailable-note">
          Financial and wagering features are not available in this frontend.
          API permissions are display guidance only.
        </p>
      </section>

      <button
        type="button"
        className="nines-account-action nines-account-action--danger"
        onClick={logout}
      >
        Sign out
      </button>
    </div>
  )
}
