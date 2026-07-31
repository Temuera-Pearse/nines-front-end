export const KYC_SESSION_STATUSES = [
  'creating',
  'pending',
  'verified',
  'failed',
  'manual_review',
  'expired',
  'creation_failed',
] as const

export type KycSessionStatus = (typeof KYC_SESSION_STATUSES)[number]

export function isKycSessionStatus(
  value: unknown,
): value is KycSessionStatus {
  return (
    typeof value === 'string' &&
    KYC_SESSION_STATUSES.includes(value as KycSessionStatus)
  )
}

export interface KycSession {
  sessionId: string
  status: 'pending' | 'manual_review'
  provider: string
  expiresAt: string
  verificationUrl: string | null
}

export interface StartedKycSession {
  sessionId: string
  status: KycSessionStatus
  provider: string
  expiresAt: string | null
  verificationUrl: string | null
}
