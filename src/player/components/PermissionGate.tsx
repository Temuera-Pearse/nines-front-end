import React from 'react'
import { useCurrentPlayer } from '../hooks/useCurrentPlayer'
import type { PermissionDataState } from '../domain/permissionDecision'
import {
  PermissionGateView,
  type PermissionGateProps,
} from './PermissionGateView'

export { PermissionGateView, type PermissionGateProps }

export const PermissionGate: React.FC<PermissionGateProps> = (props) => {
  const player = useCurrentPlayer()
  const status: PermissionDataState =
    player.status === 'idle' || player.status === 'loading'
      ? player.status
      : player.status === 'success'
        ? 'success'
        : 'error'

  return (
    <PermissionGateView
      {...props}
      player={player.data}
      status={status}
    />
  )
}
