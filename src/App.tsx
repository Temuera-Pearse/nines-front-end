import React, { useEffect, useState } from 'react'
import { useAppAuth } from './auth/AppAuthProvider'
import { RaceStatus, useRaceStore } from './state/raceStore'
import { wsService } from './ws/websocket'
import {
  getRaceConfig,
  getRaceCurrent,
  getRaceResults,
  getRaceTicksFinal,
} from './api/race'
import { OFFLINE_MODE } from './config/runtime'
import { HeaderGate } from './components/Header/HeaderGate'
import { BettingArea } from './components/BettingArea/BettingArea'
import { AddFundsDrawer } from './components/Funding/AddFundsDrawer'
import { OnTrackEventsCard } from './components/NewLayout/OnTrackEventsCard'
import { BottomWidgets } from './components/NewLayout/BottomWidgets'
import { RaceTrack } from './components/RaceTrack/RaceTrack'
import { ResultsPanel } from './components/ResultsPanel/ResultsPanel'
import { useRaceLifecycle } from './state/useRaceLifecycle'
import {
  selectResultsStandings,
  selectResultsWinner,
} from './state/raceSelectors'

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
  const { isEnabled, isLoading } = useAppAuth()
  const status = useRaceStore((s) => s.status)
  const raceId = useRaceStore((s) => s.raceId)
  const resultsWinner = useRaceStore(selectResultsWinner)
  const resultsStandings = useRaceStore(selectResultsStandings)
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
          Array.from({ length: 10 }, (_, i) => ({
            id: `horse-${i}`,
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
        store.setRaceId(current.raceId)
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
              getRaceResults(current.raceId),
              getRaceTicksFinal(current.raceId).catch(() => null),
            ])
            if (!cancelled) {
              const lastTick =
                finalTicks?.ticksFinal?.[finalTicks.ticksFinal.length - 1]
              if (lastTick?.positions) {
                applyFinalTickPositions(lastTick.positions)
              }
              store.handleRaceFinish({
                raceId: current.raceId,
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
                raceId: current.raceId,
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
            Array.from({ length: 10 }, (_, i) => ({
              id: `horse-${i}`,
              position: 0,
            })),
          )
        }

        // If WS is already connected, a sync request will fire on open; otherwise this is a no-op.
        wsService.requestSync(current.raceId)
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
    !raceId && status === RaceStatus.IDLE
      ? 'connecting'
      : utcPagePhase(clockSec)

  const isRestoringAuth = isEnabled && isLoading

  const renderPageContent = () => {
    if (isRestoringAuth) {
      return <AppLoadingState message="Restoring your session..." />
    }

    // If we have no race data yet, show the connecting screen
    if (!raceId && status === RaceStatus.IDLE) {
      return <AppLoadingState message="Connecting to race server..." />
    }

    return (
      <div
        style={{
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(165deg, #020617 0%, #0f172a 36%, #111827 70%, #172554 100%)',
          fontFamily: "'Nunito', sans-serif",
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '-4%',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 72%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '-6%',
              width: '340px',
              height: '340px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 72%)',
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: '28% minmax(0, 1fr) 24%',
            gridTemplateRows: 'minmax(0, 1fr) auto',
            gap: '10px',
            padding: '8px 16px 8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              gridColumn: '1',
              gridRow: '1 / span 2',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <BettingArea />
          </div>

          <div
            style={{
              gridColumn: '2',
              gridRow: '1',
              minWidth: 0,
              minHeight: 0,
              height: '100%',
              maxHeight: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <RaceTrack showFinishAnimation={showFinishAnimation} />
            {showResultsPanel && (
              <div
                style={{
                  position: 'absolute',
                  inset: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 30,
                  pointerEvents: 'auto',
                }}
              >
                <ResultsPanel
                  isVisible={showResultsPanel}
                  winner={resultsWinner}
                  standings={resultsStandings}
                  nextRaceStartsInSeconds={resultsCountdownSeconds}
                  onComplete={completeResultsPhase}
                />
              </div>
            )}
          </div>

          <div
            style={{
              gridColumn: '3',
              gridRow: '1',
              minWidth: 0,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <OnTrackEventsCard />
          </div>

          <div
            style={{
              gridColumn: '2 / 4',
              gridRow: '2',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <BottomWidgets />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col">
      <HeaderGate />
      <div key={pagePhase} className="page-enter flex-1 min-h-0">
        {renderPageContent()}
      </div>
      {!isRestoringAuth ? <AddFundsDrawer /> : null}
    </div>
  )
}

export default App
