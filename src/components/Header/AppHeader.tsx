import React, { useEffect, useRef, useState } from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { useRaceStore } from '../../state/raceStore'
import { formatUsdcBalance, useFundingStore } from '../../state/fundingStore'
import { useRaceHeaderTiming } from '../../state/useRaceHeaderTiming'
import { HORSE_COUNT } from '../../constants/raceParticipants'
import { AccountDropdown } from './AccountDropdown'
import { NinesLogo } from './NinesLogo'
import { formatRaceRef } from '../../utils/raceRef'

const MENU_HASHES: Record<string, string> = {
  'Add Funds': '#wallet',
  Vault: '#vault',
  Transactions: '#transactions',
  'My Bets': '#my-bets',
  Settings: '#settings',
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'N'
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}

function formatClock24(now: Date): string {
  return now.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatRaceElapsed(startUtc: string, nowMs: number): string {
  if (!startUtc) return '--:--'
  const startMs = new Date(startUtc).getTime()
  if (!Number.isFinite(startMs)) return '--:--'

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000))
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const HeaderStat: React.FC<{
  label: string
  value: string
  accentClass?: string
}> = ({ label, value, accentClass = '' }) => (
  <div className="nines-header-stat">
    <span className="nines-header-stat-label">{label}</span>
    <span className={`nines-header-stat-value ${accentClass}`.trim()}>
      {value}
    </span>
  </div>
)

export const AppHeader: React.FC = React.memo(function AppHeader() {
  const { logout, user } = useAppAuth()
  const { raceRef, horses, raceStartUtc, status } = useRaceStore()
  const balanceUsdc = useFundingStore((state) => state.balanceUsdc)
  const resetToAddFunds = useFundingStore((state) => state.resetToAddFunds)
  const headerTiming = useRaceHeaderTiming()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const menuBoundaryRef = useRef<HTMLDivElement | null>(null)
  const displayName = user?.name ?? 'Nines Player'
  const runnerCount = horses.length > 0 ? horses.length : HORSE_COUNT
  const totalPool = 0
  const housePct = 15
  const netPool = Math.round(totalPool * (1 - housePct / 100))
  const debugClock = formatClock24(now)
  const raceElapsed =
    status === 'running' ? formatRaceElapsed(raceStartUtc, now.getTime()) : '--:--'

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [])

  const handleNavigate = (target: string) => {
    const hash = MENU_HASHES[target]
    if (hash) {
      window.location.hash = hash
    }
    setIsMenuOpen(false)
  }

  const handleAddFundsClick = () => {
    resetToAddFunds()
    window.location.hash = '#wallet'
  }

  const handleLogout = () => {
    setIsMenuOpen(false)
    logout()
  }

  return (
    <header className="nines-header-shell">
      <div className="nines-header-frame">
        <div className="nines-header-primary-row nines-header-primary-row--single-line">
          <NinesLogo />

          <div className="nines-header-race-row nines-header-race-row--inline">
            <div className="nines-header-race-block nines-header-race-block--compact">
              <span className="nines-header-race-chip">
                {formatRaceRef(raceRef)}
              </span>
              <span className="nines-header-race-muted">
                {runnerCount} runners
              </span>
            </div>

            <div className="nines-header-race-block nines-header-race-block--stats">
              <HeaderStat
                label="Pool"
                value={`$${totalPool.toLocaleString()}`}
                accentClass="nines-header-stat-value--blue"
              />
              <HeaderStat
                label="House"
                value={`${housePct}%`}
                accentClass="nines-header-stat-value--orange"
              />
              <HeaderStat
                label="Net"
                value={`$${netPool.toLocaleString()}`}
                accentClass="nines-header-stat-value--green"
              />
              <HeaderStat
                label="State"
                value={headerTiming.stateLabel}
                accentClass="nines-header-stat-value--violet"
              />
              <HeaderStat
                label="Clock"
                value={debugClock}
                accentClass="nines-header-stat-value--slate"
              />
              <HeaderStat
                label="Race T"
                value={raceElapsed}
                accentClass="nines-header-stat-value--amber"
              />
            </div>

            <div className="nines-header-race-block nines-header-race-block--compact nines-header-race-block--state">
              <span
                className="nines-header-state-dot"
                style={{
                  background: headerTiming.pulseColor,
                  boxShadow: `0 0 0 3px ${headerTiming.pulseColor}33`,
                }}
              />
            </div>
          </div>

          <div className="nines-header-center">
            <div className="nines-balance-pill" aria-label="Account balance">
              <span className="nines-balance-label">Balance</span>
              <span className="nines-balance-value">
                {formatUsdcBalance(balanceUsdc)}
              </span>
            </div>

            <button
              type="button"
              className="nines-header-menu-button nines-header-menu-button--primary"
              onClick={handleAddFundsClick}
            >
              Add Funds
            </button>
          </div>

          <div className="nines-header-actions">
            <div className="nines-account-menu" ref={menuBoundaryRef}>
              <button
                type="button"
                className="nines-header-avatar"
                onClick={() => setIsMenuOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label={`${displayName} account menu`}
              >
                {getInitials(displayName)}
              </button>

              <AccountDropdown
                boundaryRef={menuBoundaryRef}
                balancePreview={`Available balance ${formatUsdcBalance(balanceUsdc)}`}
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                user={user}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
})
