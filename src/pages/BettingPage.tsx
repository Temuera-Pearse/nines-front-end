import React, { useState, useEffect } from 'react'
import { useRaceStore } from '../state/raceStore'
import { useBetStore } from '../state/betStore'
import { BetSlip } from '../components/BetSlip/BetSlip'
import { Card } from '../components/UI/Card'
import { getHorseIdentity } from '../utils/raceHelpers'

// Precise clock hook at 50ms resolution
function useClockMs() {
  const [ms, setMs] = useState(() => {
    const now = new Date()
    return now.getUTCSeconds() * 1000 + now.getUTCMilliseconds()
  })
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setMs(now.getUTCSeconds() * 1000 + now.getUTCMilliseconds())
    }, 50)
    return () => clearInterval(id)
  }, [])
  return ms
}

export const BettingPage: React.FC = () => {
  const { horses, raceId, status } = useRaceStore()
  const { selectedHorse, setSelectedHorse } = useBetStore()

  const clockMs = useClockMs()
  const clockSec = Math.floor(clockMs / 1000)

  // ms remaining until :30 (race start) — accounts for wrapping past :00
  const msUntil30 =
    clockMs <= 30_000 ? 30_000 - clockMs : 60_000 - clockMs + 30_000
  const secsUntil = msUntil30 / 1000

  const isClosingSoon = secsUntil <= 10
  const betsOpen = status === 'betsOpen'

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero countdown */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black mb-1 text-gray-800">
          Place Your Bets
        </h1>
        {raceId && (
          <div className="text-xs font-mono text-gray-400">{raceId}</div>
        )}

        {/* Big countdown */}
        <div className="mt-4 inline-flex flex-col items-center gap-1">
          <div className="text-sm uppercase tracking-widest text-gray-500 font-semibold">
            Race starts in
          </div>
          <div
            className={`text-7xl font-black tabular-nums leading-none transition-colors ${
              isClosingSoon ? 'text-red-500' : 'text-blue-600'
            }`}
          >
            {secsUntil < 10 ? secsUntil.toFixed(1) : Math.ceil(secsUntil)}s
          </div>
          {/* Progress bar */}
          <div className="w-56 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${
                isClosingSoon ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (1 - secsUntil / 30) * 100))}%`,
              }}
            />
          </div>
        </div>

        {!betsOpen && (
          <div className="mt-3 text-sm font-semibold text-orange-500">
            Betting is closed for this race
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Horse grid */}
        <div className="md:col-span-2">
          <Card title="Select Your Horse">
            <div className="grid grid-cols-2 gap-3">
              {horses.map((horse) => {
                const identity = getHorseIdentity(horse.id)
                const isSelected = selectedHorse === horse.id
                return (
                  <button
                    key={horse.id}
                    onClick={() => setSelectedHorse(horse.id)}
                    disabled={!betsOpen}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-md scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-400 bg-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Colour circle with number */}
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                        style={{
                          background: identity.hex,
                          boxShadow: `0 2px 8px ${identity.hex}55`,
                        }}
                      >
                        {identity.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 truncate">
                          {identity.name}
                        </div>
                        <div className="text-xs text-gray-400">{horse.id}</div>
                      </div>
                      {isSelected && (
                        <span className="text-blue-600 font-bold text-lg">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        <div>
          <BetSlip />
        </div>
      </div>
    </div>
  )
}
