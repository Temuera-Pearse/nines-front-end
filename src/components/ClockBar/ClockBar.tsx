import React, { useEffect, useRef, useState } from 'react'

/**
 * Returns the number of seconds until second :30 of the current minute.
 * If we're already past :30 (i.e. the race is running), returns 0.
 * Wraps into the next minute correctly.
 */
function secsUntilRaceStart(now: Date): number {
  const s = now.getUTCSeconds() + now.getUTCMilliseconds() / 1000
  if (s < 30) return 30 - s // counting down to :30
  return 60 - s + 30 // counting down to next :30
}

/**
 * Phase derived purely from wall-clock UTC seconds.
 *   0–24   → idle / betting open
 *  25–29   → countdown (extended from :25)
 *  30–50   → race running
 *  51–59   → results
 */
function clockPhase(s: number): 'idle' | 'countdown' | 'running' | 'results' {
  if (s < 25) return 'idle'
  if (s < 30) return 'countdown'
  if (s <= 50) return 'running'
  return 'results'
}

interface ClockBarProps {
  /** Optional extra class names for the outer wrapper */
  className?: string
}

export const ClockBar: React.FC<ClockBarProps> = ({ className = '' }) => {
  const [utc, setUtc] = useState(() => new Date())
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let running = true

    const tick = () => {
      if (!running) return
      setUtc(new Date())
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      running = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const h = String(utc.getUTCHours()).padStart(2, '0')
  const m = String(utc.getUTCMinutes()).padStart(2, '0')
  const s = String(utc.getUTCSeconds()).padStart(2, '0')
  const ms = String(Math.floor(utc.getUTCMilliseconds() / 10)).padStart(2, '0')
  const utcStr = `${h}:${m}:${s}.${ms}`

  const secs = utc.getUTCSeconds() + utc.getUTCMilliseconds() / 1000
  const phase = clockPhase(utc.getUTCSeconds())

  let countdownLabel = ''
  let countdownValue = ''
  let pillColor = ''

  if (phase === 'idle') {
    const remaining = secsUntilRaceStart(utc)
    countdownValue = remaining.toFixed(1) + 's'
    countdownLabel = 'Race in'
    pillColor = 'bg-blue-600'
  } else if (phase === 'countdown') {
    const remaining = 30 - secs // seconds until :30
    countdownValue = remaining.toFixed(1) + 's'
    countdownLabel = 'Starting'
    pillColor = 'bg-yellow-500'
  } else if (phase === 'running') {
    const elapsed = secs - 30
    countdownValue = elapsed.toFixed(1) + 's'
    countdownLabel = 'Racing'
    pillColor = 'bg-green-600'
  } else {
    // results
    const nextStart = secsUntilRaceStart(utc)
    countdownValue = nextStart.toFixed(1) + 's'
    countdownLabel = 'Next race'
    pillColor = 'bg-purple-600'
  }

  return (
    <div
      className={`flex items-center gap-4 px-4 py-2 bg-gray-900 text-white text-sm font-mono select-none ${className}`}
    >
      {/* Left: branding stub so the bar spans full width */}
      <span className="text-gray-400 tracking-widest uppercase text-xs font-sans font-semibold">
        Nines
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Countdown pill */}
      <div
        className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full ${pillColor}`}
      >
        <span className="text-gray-200 text-xs">{countdownLabel}</span>
        <span className="text-white font-bold tabular-nums">
          {countdownValue}
        </span>
      </div>

      {/* UTC clock */}
      <div className="flex items-center gap-1">
        <span className="text-gray-400 text-xs">UTC</span>
        <span className="text-white tabular-nums tracking-tight">{utcStr}</span>
      </div>
    </div>
  )
}
