import React from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import './Header.css'
import { AppHeader } from './AppHeader'
import { NinesLogo } from './NinesLogo'
import { PublicHeader } from './PublicHeader'

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
  const { isAuthenticated, isLoading } = useAppAuth()

  if (isLoading) {
    return <HeaderLoadingState />
  }

  if (isAuthenticated) {
    return <AppHeader />
  }

  return <PublicHeader />
})
