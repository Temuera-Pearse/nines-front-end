import React, { useEffect, useState } from 'react'
import { RaceStatus, useRaceStore } from './state/raceStore'
import { wsService } from './ws/websocket'
import { getRaceConfig, getRaceCurrent, getRaceResults } from './api/race'
import { OFFLINE_MODE } from './config/runtime'
import { HeaderGate } from './components/Header/HeaderGate'
import { CompactRaceInfo } from './components/NewLayout/CompactRaceInfo'
import { OnTrackEventsCard } from './components/NewLayout/OnTrackEventsCard'
import { ParimutuelPanel } from './components/NewLayout/ParimutuelPanel'
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

function App() {
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

        const start =
          typeof current.startTime === 'string' ? current.startTime : ''
        const end = typeof current.endTime === 'string' ? current.endTime : ''

        if (end) {
          try {
            const results = await getRaceResults(current.raceId)
            if (!cancelled) {
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

  const renderPageContent = () => {
    // If we have no race data yet, show the connecting screen
    if (!raceId && status === RaceStatus.IDLE) {
      return (
        <div className="flex items-center justify-center h-full min-h-[320px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🐎</div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Nines</h1>
            <p className="text-gray-600">Connecting to race server...</p>
          </div>
        </div>
      )
    }

    return (
      <div
        style={{
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(160deg, #dbeafe 0%, #eff6ff 40%, #fef9ee 75%, #ecfdf5 100%)',
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
                'radial-gradient(circle, rgba(79,142,247,0.09) 0%, transparent 70%)',
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
                'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)',
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 20px 10px',
            overflow: 'hidden',
          }}
        >
          <CompactRaceInfo />

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              gap: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                flex: '0 0 75%',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    flex: '0 0 33.333%',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    minHeight: 0,
                    height: '100%',
                    maxHeight: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <OnTrackEventsCard />
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    height: '100%',
                    maxHeight: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <RaceTrack showFinishAnimation={showFinishAnimation} />
                </div>
              </div>
              {showResultsPanel && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '12px 12px 96px calc(33.333% + 12px)',
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
              <BottomWidgets />
            </div>

            <div style={{ flex: '0 0 25%', minWidth: 0, overflow: 'hidden' }}>
              <ParimutuelPanel />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col">
      <HeaderGate />
      <div key={pagePhase} className="page-enter flex-1 min-h-0">
        {renderPageContent()}
      </div>
    </div>
  )
}

export default App
