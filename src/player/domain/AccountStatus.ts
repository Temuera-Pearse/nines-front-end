export const ACCOUNT_STATUSES = [
  'restricted',
  'active',
  'suspended',
  'closed',
] as const

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export function isAccountStatus(value: unknown): value is AccountStatus {
  return (
    typeof value === 'string' &&
    ACCOUNT_STATUSES.includes(value as AccountStatus)
  )
}
