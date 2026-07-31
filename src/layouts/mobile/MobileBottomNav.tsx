import React from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { useCurrentPlayer } from '../../player/hooks/useCurrentPlayer'

export const MobileBottomNav: React.FC = () => {
  const { auth0SessionIsAuthenticated } = useAppAuth()
  const player = useCurrentPlayer()
  const accountHint =
    auth0SessionIsAuthenticated && player.status === 'success'
      ? player.data?.accountStatus
      : auth0SessionIsAuthenticated
        ? 'loading'
        : 'sign in'

  return (
    <nav className="nines-mobile-nav" aria-label="Primary">
      <button
        type="button"
        onClick={() => {
          window.location.hash = '#race'
        }}
      >
        <span aria-hidden="true">●</span>
        Race
      </button>
      <button
        type="button"
        disabled
        aria-describedby="nines-selection-unavailable"
      >
        <span aria-hidden="true">◇</span>
        Selection
        <small id="nines-selection-unavailable">Unavailable</small>
      </button>
      <button
        type="button"
        onClick={() => {
          window.location.hash = '#account'
        }}
      >
        <span aria-hidden="true">○</span>
        Account
        <small>{accountHint}</small>
      </button>
    </nav>
  )
}
