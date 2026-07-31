import React from 'react'
import type { CurrentPlayer } from '../domain/CurrentPlayer'
import type { PlayerPermission } from '../domain/PlayerPermissions'
import {
  isPermissionAllowed,
  type PermissionDataState,
} from '../domain/permissionDecision'

export interface PermissionGateProps {
  permission: PlayerPermission
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
  mode?: 'hide' | 'fallback' | 'disable'
}

interface PermissionGateViewProps extends PermissionGateProps {
  player: CurrentPlayer | null
  status: PermissionDataState
}

export const PermissionGateView: React.FC<PermissionGateViewProps> = ({
  permission,
  children,
  fallback = null,
  loadingFallback = null,
  mode = 'fallback',
  player,
  status,
}) => {
  if (status === 'loading' || status === 'idle') {
    return <>{loadingFallback}</>
  }

  const isAllowed = isPermissionAllowed(status, player, permission)
  if (isAllowed) return <>{children}</>
  if (mode === 'hide') return null
  if (mode === 'disable' && React.isValidElement(children)) {
    return (
      <>
        {React.cloneElement(
          children as React.ReactElement<{
            disabled?: boolean
            'aria-disabled'?: boolean
          }>,
          { disabled: true, 'aria-disabled': true },
        )}
        {fallback}
      </>
    )
  }
  return <>{fallback}</>
}
