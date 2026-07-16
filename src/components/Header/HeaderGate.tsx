import React, { Suspense } from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import './Header.css'
import { PUBLIC_VIEWER_MODE } from '../../config/features'
import { NinesLogo } from './NinesLogo'
import { PublicHeader } from './PublicHeader'

const PrivateAppHeader = !PUBLIC_VIEWER_MODE
  ? React.lazy(() =>
      import('./AppHeader').then((module) => ({
        default: module.AppHeader,
      })),
    )
  : null

const HeaderLoadingState: React.FC = React.memo(function HeaderLoadingState() {
  return (
    <header className="nines-header-shell" aria-busy="true">
      <div className="nines-header-frame">
        <NinesLogo />
        <div className="nines-header-actions" aria-hidden="true">
          <div className="nines-loading-chip nines-loading-chip--wide" />
          <div className="nines-loading-chip nines-loading-chip--wide" />
          <div className="nines-loading-chip nines-loading-chip--avatar" />
        </div>
      </div>
    </header>
  )
})

export const HeaderGate: React.FC = React.memo(function HeaderGate() {
  const { hasConfirmedPlayer, isLoading, isPlayerVerificationLoading } =
    useAppAuth()

  if (isLoading || isPlayerVerificationLoading) {
    return <HeaderLoadingState />
  }

  if (PrivateAppHeader && hasConfirmedPlayer && !PUBLIC_VIEWER_MODE) {
    return (
      <Suspense fallback={<HeaderLoadingState />}>
        <PrivateAppHeader />
      </Suspense>
    )
  }

  return <PublicHeader />
})
