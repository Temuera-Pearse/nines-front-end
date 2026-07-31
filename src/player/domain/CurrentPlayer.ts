import { isKycStatus, type KycStatus } from '../../kyc/domain/KycStatus'
import { isAccountStatus, type AccountStatus } from './AccountStatus'
import {
  parsePlayerPermissions,
  type PlayerPermissions,
} from './PlayerPermissions'

export interface CurrentPlayer {
  playerId: string
  email: string | null
  displayName: string | null
  accountStatus: AccountStatus
  kycStatus: KycStatus
  permissions: PlayerPermissions
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

export function parseCurrentPlayer(value: unknown): CurrentPlayer {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid current-player response')
  }
  const record = value as Record<string, unknown>
  if (
    typeof record.playerId !== 'string' ||
    !record.playerId.trim() ||
    !nullableString(record.email) ||
    !nullableString(record.displayName) ||
    !isAccountStatus(record.accountStatus) ||
    !isKycStatus(record.kycStatus)
  ) {
    throw new Error('Invalid current-player response')
  }

  return {
    playerId: record.playerId,
    email: record.email,
    displayName: record.displayName,
    accountStatus: record.accountStatus,
    kycStatus: record.kycStatus,
    permissions: parsePlayerPermissions(record.permissions),
  }
}
