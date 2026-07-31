import type { CurrentPlayer } from './CurrentPlayer'
import type { PlayerPermission } from './PlayerPermissions'

export type PermissionDataState = 'idle' | 'loading' | 'success' | 'error'

export function isPermissionAllowed(
  status: PermissionDataState,
  player: CurrentPlayer | null,
  permission: PlayerPermission,
): boolean {
  return status === 'success' && player?.permissions[permission] === true
}
