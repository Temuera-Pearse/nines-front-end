import React, { Suspense, useEffect, useState } from 'react'
import { useAppAuth } from './auth/AppAuthProvider'
import { RaceStatus, useRaceStore } from './state/raceStore'
import { wsService } from './ws/websocket'
import { getDefaultHorseIds } from './constants/raceParticipants'
import {
  getRaceConfig,
  getRaceCurrent,
  getRaceResults,
  getRaceTicksFinal,
} from './api/race'
import { PUBLIC_VIEWER_MODE } from './config/features'
import { OFFLINE_MODE } from './config/runtime'
import { HeaderGate } from './components/Header/HeaderGate'
import { useRaceLifecycle } from './state/useRaceLifecycle'
import {
  selectResultsStandings,
  selectResultsWinner,
} from './state/raceSelectors'
import { useMediaQuery } from './hooks/useMediaQuery'
import { DesktopLayout } from './layouts/desktop/DesktopLayout'
import { MobileLayout } from './layouts/mobile/MobileLayout'
import './App.css'

const PrivateAddFundsDrawer = !PUBLIC_VIEWER_MODE
  ? React.lazy(() =>
      import('./components/Funding/AddFundsDrawer').then((module) => ({
        default: module.AddFundsDrawer,
      })),
    )
  : null

/**
 * Derive the visible page from wall-clock UTC seconds.
 *  Always show track (race page with integrated results)
 */
function utcPagePhase(sec: number): 'track' {
  return 'track'
}

const AppLoadingState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-full min-h-[320px]">
    <div className="text-center">
      <div className="text-6xl mb-4">🐎</div>
      <h1 className="text-3xl font-bold mb-2">Welcome to Nines</h1>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)

function App() {
  const { hasConfirmedPlayer, isEnabled, isLoading } = useAppAuth()
  const status = useRaceStore((s) => s.status)
  const raceRef = useRaceStore((s) => s.raceRef)
  const resultsWinner = useRaceStore(selectResultsWinner)
  const resultsStandings = useRaceStore(selectResultsStandings)
  const isMobileLayout = useMediaQuery(
    '(max-width: 768px), (max-width: 1024px) and (orientation: portrait)',
  )
  const {
    showFinishAnimation,
    showResultsPanel,
    resultsCountdownSeconds,
    completeResultsPhase,
  } = useRaceLifecycle()

  // Drive page visibility from UTC clock so layout matches the backend cycle exactly.
  const [clockSec, setClockSec] = useState(() => new Date().getUTCSeconds())
  useEffect(() => {
    const id = setInterval(() => setClockSec(new Date().getUTCSeconds()), 100)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false

    const applyRaceGeometry = (config?: Record<string, unknown>, finishLine?: unknown) => {
      const trackLengthMeters =
        typeof config?.trackLength === 'number' && Number.isFinite(config.trackLength)
          ? config.trackLength
          : undefined
      const finishLineMeters =
        typeof finishLine === 'number' && Number.isFinite(finishLine)
          ? finishLine
          : typeof config?.finishRatio === 'number' &&
              Number.isFinite(config.finishRatio) &&
              trackLengthMeters !== undefined
            ? trackLengthMeters * config.finishRatio
            : trackLengthMeters

      if (
        trackLengthMeters !== undefined ||
        finishLineMeters !== undefined
      ) {
        useRaceStore
          .getState()
          .setRaceGeometry(trackLengthMeters, finishLineMeters)
      }
    }

    const applyFinalTickPositions = (positions: number[]) => {
      if (!Array.isArray(positions) || positions.length === 0) return
      const store = useRaceStore.getState()
      const order =
        store.horseOrder.length === positions.length
          ? store.horseOrder
          : store.horses.length === positions.length
            ? store.horses.map((horse) => horse.id)
            : Array.from({ length: positions.length }, (_, index) => `horse-${index}`)

      store.setHorseOrder(order)
      store.setHorses(
        order.map((id, index) => ({
          id,
          position:
            typeof positions[index] === 'number' && Number.isFinite(positions[index])
              ? positions[index]
              : 0,
        })),
      )
    }

    const ensureDemoState = () => {
      const store = useRaceStore.getState()
      if (store.horses.length === 0) {
        store.setHorses(
          getDefaultHorseIds().map((id) => ({
            id,
            position: 0,
          })),
        )
      }
      if (store.status === RaceStatus.IDLE) {
        store.setStatus(RaceStatus.BETS_OPEN)
      }
    }

    if (OFFLINE_MODE) {
      ensureDemoState()
      return () => {
        cancelled = true
        wsService.disconnect()
      }
    }

    wsService.connect()

    ;(async () => {
      try {
        await getRaceConfig()
      } catch {
        // Backend may not expose config in dev yet; WS-only mode still works.
      }

      try {
        const current = await getRaceCurrent()
        if (cancelled) return

        const store = useRaceStore.getState()
        // Stable legacy policy: records created before public references exist
        // remain unavailable rather than receiving a synthetic identity on read.
        if (!current.raceRef) return
        store.setRaceRef(current.raceRef)
        applyRaceGeometry(
          current.config as Record<string, unknown> | undefined,
          current.finishLine,
        )

        const start =
          typeof current.startTime === 'string' ? current.startTime : ''
        const end = typeof current.endTime === 'string' ? current.endTime : ''

        if (end) {
          try {
            const [results, finalTicks] = await Promise.all([
              getRaceResults(current.raceRef),
              getRaceTicksFinal(current.raceRef).catch(() => null),
            ])
            if (!cancelled) {
              const lastTick =
                finalTicks?.ticksFinal?.[finalTicks.ticksFinal.length - 1]
              if (lastTick?.positions) {
                applyFinalTickPositions(lastTick.positions)
              }
              store.handleRaceFinish({
                raceRef: current.raceRef,
                timestampUtc:
                  typeof results.timestampUtc === 'string'
                    ? results.timestampUtc
                    : end,
                winnerId:
                  typeof results.winnerId === 'string'
                    ? results.winnerId
                    : typeof results.winner === 'string'
                      ? results.winner
                      : undefined,
                finishOrder: Array.isArray(results.finishOrder)
                  ? results.finishOrder
                  : Array.isArray(results.placements)
                    ? results.placements
                    : undefined,
                finishTimesMs: results.finishTimesMs,
                finishTickIndex: results.finishTickIndex,
                presentation: results.presentation,
              })
            }
          } catch {
            if (!cancelled) {
              store.handleRaceFinish({
                raceRef: current.raceRef,
                timestampUtc: end,
              })
            }
          }
        } else if (start) {
          store.setRaceStartUtc(start)
          store.setInterpolationEnabled(true)
          store.setStatus(RaceStatus.RUNNING)
        } else if (useRaceStore.getState().status === RaceStatus.IDLE) {
          // If backend doesn't provide phase timestamps, default to betsOpen.
          store.setStatus(RaceStatus.BETS_OPEN)
        }

        if (useRaceStore.getState().horses.length === 0) {
          store.setHorses(
            getDefaultHorseIds().map((id) => ({
              id,
              position: 0,
            })),
          )
        }

        // If WS is already connected, a sync request will fire on open; otherwise this is a no-op.
        wsService.requestSync(current.raceRef)
      } catch {
        // Backend might not be reachable yet; fall back to demo state.
        ensureDemoState()
      }
    })()

    // WebSocket service is already initialized
    // Cleanup on unmount
    return () => {
      cancelled = true
      wsService.disconnect()
    }
  }, [])

  // Track the current page key so we can re-trigger the fade on phase change
  const pagePhase =
    !raceRef && status === RaceStatus.IDLE
      ? 'connecting'
      : utcPagePhase(clockSec)

  const isRestoringAuth = isEnabled && isLoading

  const renderPageContent = () => {
    if (isRestoringAuth) {
      return <AppLoadingState message="Restoring your session..." />
    }

    // If we have no race data yet, show the connecting screen
    if (!raceRef && status === RaceStatus.IDLE) {
      return <AppLoadingState message="Connecting to race server..." />
    }

    const layoutProps = {
      showFinishAnimation,
      showResultsPanel,
      resultsWinner,
      resultsStandings,
      resultsCountdownSeconds,
      onCompleteResultsPhase: completeResultsPhase,
    }

    return (
      <div className="nines-race-shell">
        <div className="nines-race-backdrop">
          <div className="nines-race-backdrop-glow nines-race-backdrop-glow--blue" />
          <div className="nines-race-backdrop-glow nines-race-backdrop-glow--cyan" />
        </div>

        {isMobileLayout ? (
          <MobileLayout {...layoutProps} />
        ) : (
          <DesktopLayout {...layoutProps} />
        )}
      </div>
    )
  }

  return (
    <div className="nines-app-root h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col">
      <HeaderGate />
      <div key={pagePhase} className="page-enter flex-1 min-h-0">
        {renderPageContent()}
      </div>
      {PrivateAddFundsDrawer &&
      hasConfirmedPlayer &&
      !isRestoringAuth &&
      !PUBLIC_VIEWER_MODE ? (
        <Suspense fallback={null}>
          <PrivateAddFundsDrawer />
        </Suspense>
      ) : null}
    </div>
  )
}

export default App
