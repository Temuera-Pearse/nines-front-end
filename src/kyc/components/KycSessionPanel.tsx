import React from 'react'
import { IS_DEVELOPMENT } from '../../config/features'
import type { KycSession } from '../domain/KycSession'
import { parseKycPopupUrl } from '../popup/kycPopup'

export const KycSessionPanel: React.FC<{
  session: KycSession
  isOpening: boolean
  onResume: () => void
}> = ({ session, isOpening, onResume }) => {
  const verificationUrl = parseKycPopupUrl(
    session.verificationUrl,
    IS_DEVELOPMENT,
  )
  return (
    <div className="nines-kyc-session">
      <p>Session expires {new Date(session.expiresAt).toLocaleString()}.</p>
      {verificationUrl ? (
        <button
          type="button"
          className="nines-account-action nines-account-action--primary"
          disabled={isOpening}
          onClick={onResume}
        >
          {isOpening ? 'Opening verification…' : 'Resume verification'}
        </button>
      ) : (
        <p className="nines-unavailable-note">
          No safe verification link is currently available.
        </p>
      )}
    </div>
  )
}
