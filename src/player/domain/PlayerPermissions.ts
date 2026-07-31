export const PLAYER_PERMISSION_KEYS = [
  'viewRaces',
  'usePracticeBalance',
  'deposit',
  'withdraw',
  'placeWager',
  'startKyc',
  'manageProfile',
] as const

export type PlayerPermission = (typeof PLAYER_PERMISSION_KEYS)[number]
export type PlayerPermissions = Record<PlayerPermission, boolean>

export const DENIED_PLAYER_PERMISSIONS: PlayerPermissions = {
  viewRaces: false,
  usePracticeBalance: false,
  deposit: false,
  withdraw: false,
  placeWager: false,
  startKyc: false,
  manageProfile: false,
}

export function parsePlayerPermissions(value: unknown): PlayerPermissions {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid player permissions')
  }
  const record = value as Record<string, unknown>
  const permissions = { ...DENIED_PLAYER_PERMISSIONS }
  for (const key of PLAYER_PERMISSION_KEYS) {
    if (typeof record[key] !== 'boolean') {
      throw new Error(`Invalid player permission: ${key}`)
    }
    permissions[key] = record[key]
  }
  return permissions
}
