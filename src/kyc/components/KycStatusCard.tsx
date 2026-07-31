import React from 'react'
import { accountErrorMessage, NinesApiError } from '../../api/apiError'
import type { KycProfile } from '../domain/KycProfile'
import { isKycStatus, type KycStatus } from '../domain/KycStatus'
import type { KycPopupStatus } from '../popup/kycPopup'
import { KycExplanation } from './KycExplanation'
import { KycSessionPanel } from './KycSessionPanel'

const KYC_COPY: Record<
  KycStatus,
  { title: string; detail: string; action: string | null }
> = {
  not_started: {
    title: 'Not started',
    detail:
      'Identity verification has not started. Regulated functions are unavailable.',
    action: 'Verify identity',
  },
  pending: {
    title: 'In progress',
    detail: 'Verification is in progress. Starting a session is not verification.',
    action: null,
  },
  verified: {
    title: 'Completed',
    detail:
      'Identity verification is current. Account conditions and API permissions still apply.',
    action: null,
  },
  failed: {
    title: 'Unsuccessful',
    detail:
      'The verification attempt was unsuccessful. No provider-internal details are available here.',
    action: 'Try verification again',
  },
  manual_review: {
    title: 'Review required',
    detail:
      'Verification requires review. No completion time can be promised.',
    action: null,
  },
  expired: {
    title: 'Expired',
    detail: 'Identity verification is no longer current.',
    action: 'Start verification again',
  },
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString()
}

export const KycStatusCard: React.FC<{
  profile: KycProfile | null
  fallbackStatus?: unknown
  canStart: boolean
  isLoading: boolean
  isRefreshing: boolean
  isStarting: boolean
  error: unknown
  startError: unknown
  popupStatus: KycPopupStatus
  popupError: unknown
  onRefresh: () => void
  onStart: () => void
  onResume: () => void
}> = ({
  profile,
  fallbackStatus,
  canStart,
  isLoading,
  isRefreshing,
  isStarting,
  error,
  startError,
  popupStatus,
  popupError,
  onRefresh,
  onStart,
  onResume,
}) => {
  if (isLoading) {
    return (
      <section className="nines-kyc-card" aria-busy="true" aria-live="polite">
        <h3>Identity verification</h3>
        <div className="nines-account-skeleton" />
        <span className="sr-only">Loading identity verification status</span>
      </section>
    )
  }

  const candidateStatus = profile?.status ?? fallbackStatus
  const status = isKycStatus(candidateStatus) ? candidateStatus : null
  const copy = status
    ? KYC_COPY[status]
    : {
        title: 'Status unavailable',
        detail:
          'Identity verification status could not be confirmed. Related features remain unavailable.',
        action: null,
      }
  const displayError =
    error ?? startError ?? (popupStatus === 'error' ? popupError : null)
  const correlationId =
    displayError instanceof NinesApiError
      ? displayError.correlationId
      : null
  const expiry = formatDate(profile?.expiresAt ?? null)
  const verifiedAt = formatDate(profile?.verifiedAt ?? null)

  return (
    <section className="nines-kyc-card" aria-live="polite">
      <div className="nines-card-heading">
        <div>
          <span className="nines-card-eyebrow">Identity verification</span>
          <h3>{copy.title}</h3>
        </div>
        <span
          className={`nines-status-badge nines-status-badge--kyc-${status ?? 'unknown'}`}
        >
          KYC: {copy.title}
        </span>
      </div>
      <p>{copy.detail}</p>
      {verifiedAt ? <p>Completed {verifiedAt}.</p> : null}
      {expiry ? <p>Current until {expiry}.</p> : null}
      {profile?.currentSession ? (
        <KycSessionPanel
          session={profile.currentSession}
          isOpening={popupStatus === 'opening' || popupStatus === 'open'}
          onResume={onResume}
        />
      ) : null}
      <div className="nines-card-actions">
        {copy.action && canStart ? (
          <button
            type="button"
            className="nines-account-action nines-account-action--primary"
            disabled={isStarting}
            onClick={onStart}
          >
            {isStarting ? 'Starting verification…' : copy.action}
          </button>
        ) : null}
        <button
          type="button"
          className="nines-account-action"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh status'}
        </button>
      </div>
      {popupStatus === 'open' ? (
        <p role="status">
          Verification window opened. Complete or cancel it to continue.
        </p>
      ) : popupStatus === 'completed' ? (
        <p role="status">
          Verification completed. Account status has been refreshed.
        </p>
      ) : popupStatus === 'cancelled' ? (
        <p role="status">
          Verification was cancelled. Your KYC status was not changed.
        </p>
      ) : popupStatus === 'blocked' ? (
        <p className="nines-inline-error" role="alert">
          The verification popup was blocked. Allow popups for Nines and try
          again.
        </p>
      ) : popupStatus === 'closed' ? (
        <p role="status">
          The verification window was closed before a result was received.
        </p>
      ) : popupStatus === 'timeout' ? (
        <p className="nines-inline-error" role="alert">
          The verification window timed out. Refresh status before trying
          again.
        </p>
      ) : null}
      {displayError ? (
        <div className="nines-inline-error" role="alert">
          <p>{accountErrorMessage(displayError)}</p>
          {correlationId ? <p>Reference: {correlationId}</p> : null}
        </div>
      ) : null}
      <KycExplanation />
    </section>
  )
}
