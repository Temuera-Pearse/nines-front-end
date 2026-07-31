import { isKycStatus, type KycStatus } from './KycStatus'
import {
  isKycSessionStatus,
  type KycSession,
  type StartedKycSession,
} from './KycSession'

export interface KycProfile {
  status: KycStatus
  verifiedAt: string | null
  expiresAt: string | null
  currentSession: KycSession | null
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    Number.isFinite(Date.parse(value))
  )
}

function isNullableIsoTimestamp(value: unknown): value is string | null {
  return value === null || isIsoTimestamp(value)
}

function parseCurrentSession(value: unknown): KycSession | null {
  if (value === null) return null
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid KYC session')
  }
  const record = value as Record<string, unknown>
  if (
    typeof record.sessionId !== 'string' ||
    !record.sessionId.trim() ||
    (record.status !== 'pending' && record.status !== 'manual_review') ||
    typeof record.provider !== 'string' ||
    !record.provider.trim() ||
    !isIsoTimestamp(record.expiresAt) ||
    !nullableString(record.verificationUrl)
  ) {
    throw new Error('Invalid KYC session')
  }
  return {
    sessionId: record.sessionId,
    status: record.status,
    provider: record.provider,
    expiresAt: record.expiresAt,
    verificationUrl: record.verificationUrl,
  }
}

export function parseKycProfile(value: unknown): KycProfile {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid KYC profile response')
  }
  const record = value as Record<string, unknown>
  if (
    !isKycStatus(record.status) ||
    !isNullableIsoTimestamp(record.verifiedAt) ||
    !isNullableIsoTimestamp(record.expiresAt)
  ) {
    throw new Error('Invalid KYC profile response')
  }
  return {
    status: record.status,
    verifiedAt: record.verifiedAt,
    expiresAt: record.expiresAt,
    currentSession: parseCurrentSession(record.currentSession),
  }
}

export function parseStartedKycSession(value: unknown): StartedKycSession {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid KYC session response')
  }
  const record = value as Record<string, unknown>
  if (
    typeof record.sessionId !== 'string' ||
    !record.sessionId.trim() ||
    !isKycSessionStatus(record.status) ||
    typeof record.provider !== 'string' ||
    !record.provider.trim() ||
    !isNullableIsoTimestamp(record.expiresAt) ||
    !nullableString(record.verificationUrl)
  ) {
    throw new Error('Invalid KYC session response')
  }
  return {
    sessionId: record.sessionId,
    status: record.status,
    provider: record.provider,
    expiresAt: record.expiresAt,
    verificationUrl: record.verificationUrl,
  }
}
