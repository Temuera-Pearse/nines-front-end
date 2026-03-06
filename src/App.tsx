import React, { useEffect, useRef, useState } from 'react'
import { useRaceStore } from './state/raceStore'
import { wsService } from './ws/websocket'
import { getRaceConfig, getRaceCurrent, getRaceResults } from './api/race'
import { OFFLINE_MODE } from './config/runtime'
import { TopNav } from './components/NewLayout/TopNav'
import { CompactRaceInfo } from './components/NewLayout/CompactRaceInfo'
import { ParimutuelPanel } from './components/NewLayout/ParimutuelPanel'
import { BottomWidgets } from './components/NewLayout/BottomWidgets'
import { RaceTrack } from './components/RaceTrack/RaceTrack'

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

  // Drive page visibility from UTC clock so layout matches the backend cycle exactly.
  const [clockSec, setClockSec] = useState(() => new Date().getUTCSeconds())
  useEffect(() => {
    const id = setInterval(() => setClockSec(new Date().getUTCSeconds()), 100)
    return () => clearInterval(id)
  }, [])

  // Reset all horse positions to 0 whenever the minute wraps (:59 → :00).
  // This lives in App (not RacePage) so the ref persists across page transitions.
  const prevClockSecRef = useRef<number>(clockSec)
  useEffect(() => {
    const prev = prevClockSecRef.current
    // Detect wrap: previous second was in the second half, new second is near zero
    if (prev > 50 && clockSec <= 5) {
      const { horses, setHorses } = useRaceStore.getState()
      if (horses.length > 0) {
        setHorses(horses.map((h) => ({ ...h, position: 0 })))
      }
    }
    prevClockSecRef.current = clockSec
  }, [clockSec])

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
      if (store.status === 'idle') {
        store.setStatus('betsOpen')
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
          store.setRaceEndUtc(end)
          store.setStatus('finished')
          try {
            const results = await getRaceResults(current.raceId)
            // Backend may return either winner/placements or winnerId/finishOrder
            const w = results.winner ?? (results as any).winnerId
            const p = results.placements ?? (results as any).finishOrder
            if (!cancelled && w && Array.isArray(p)) {
              store.setWinner(w as string, p as string[])
            }
          } catch {
            // Results may not exist; keep UI usable.
          }
        } else if (start) {
          store.setRaceStartUtc(start)
          store.setStatus('running')
        } else if (useRaceStore.getState().status === 'idle') {
          // If backend doesn't provide phase timestamps, default to betsOpen.
          store.setStatus('betsOpen')
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
    !raceId && status === 'idle' ? 'connecting' : utcPagePhase(clockSec)

  const renderPage = () => {
    // If we have no race data yet, show the connecting screen
    if (!raceId && status === 'idle') {
      return (
        <div className="flex items-center justify-center h-full">
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

        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
          <TopNav />
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
                flex: '0 0 65%',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                overflow: 'hidden',
              }}
            >
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <RaceTrack />
              </div>
              <BottomWidgets />
            </div>

            <div style={{ flex: '0 0 35%', minWidth: 0, overflow: 'hidden' }}>
              <ParimutuelPanel />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col">
      <div key={pagePhase} className="page-enter flex-1">
        {renderPage()}
      </div>
    </div>
  )
}

export default App
