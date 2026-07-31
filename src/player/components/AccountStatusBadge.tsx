import React from 'react'
import {
  isAccountStatus,
  type AccountStatus,
} from '../domain/AccountStatus'

const ACCOUNT_COPY: Record<
  AccountStatus,
  { label: string; explanation: string }
> = {
  active: {
    label: 'Active',
    explanation:
      'Your account is active. Individual features still depend on API permissions.',
  },
  restricted: {
    label: 'Restricted',
    explanation:
      'Some account features are currently unavailable. The available actions below reflect the latest account policy.',
  },
  suspended: {
    label: 'Suspended',
    explanation: 'Account features are unavailable while this account is suspended.',
  },
  closed: {
    label: 'Closed',
    explanation:
      'This account is closed. No recovery action is available in the player application.',
  },
}

export const AccountStatusBadge: React.FC<{
  status: unknown
  showExplanation?: boolean
}> = ({ status, showExplanation = false }) => {
  const safeStatus = isAccountStatus(status) ? status : null
  const copy = safeStatus
    ? ACCOUNT_COPY[safeStatus]
    : {
        label: 'Unavailable',
        explanation:
          'The account status could not be confirmed. Account features remain unavailable.',
      }

  return (
    <div className="nines-account-status">
      <span
        className={`nines-status-badge nines-status-badge--${safeStatus ?? 'unknown'}`}
      >
        Account: {copy.label}
      </span>
      {showExplanation ? <p>{copy.explanation}</p> : null}
    </div>
  )
}
