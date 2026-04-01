import { useEffect, useState } from 'react'

export type RaceHeaderPhaseKey =
  | 'betsOpen'
  | 'betsClosed'
  | 'running'
  | 'settlingBets'
  | 'resetting'

export interface RaceHeaderTiming {
  key: RaceHeaderPhaseKey
  timerLabel: 'STARTS IN' | 'RACING LIVE' | 'BETS OPEN IN' | 'RESETTING'
  timerValue: string | null
  stateLabel:
    | 'Bets open'
    | 'Bets closed'
    | 'Running'
    | 'Settling bets'
    | 'Resetting'
  navStatusText:
    | 'BETS OPEN'
    | 'BETS CLOSED'
    | 'RUNNING'
    | 'SETTLING BETS'
    | 'RESETTING'
  accent:
    | 'linear-gradient(135deg, #4f8ef7, #6c63ff)'
    | 'linear-gradient(135deg, #ff4757, #ff6b81)'
    | 'linear-gradient(135deg, #22c55e, #16a34a)'
    | 'linear-gradient(135deg, #f97316, #fb923c)'
    | 'linear-gradient(135deg, #64748b, #475569)'
  pulseColor: '#22c55e' | '#ef4444' | '#f97316' | '#64748b'
  isLive: boolean
}

function formatHeaderCountdown(seconds: number): string {
  return `00:${String(seconds).padStart(2, '0')}`
}

export function getRaceHeaderTiming(now: Date = new Date()): RaceHeaderTiming {
  const second = now.getUTCSeconds()

  if (second < 27) {
    return {
      key: 'betsOpen',
      timerLabel: 'STARTS IN',
      timerValue: formatHeaderCountdown(30 - second),
      stateLabel: 'Bets open',
      navStatusText: 'BETS OPEN',
      accent: 'linear-gradient(135deg, #4f8ef7, #6c63ff)',
      pulseColor: '#22c55e',
      isLive: false,
    }
  }

  if (second < 30) {
    return {
      key: 'betsClosed',
      timerLabel: 'STARTS IN',
      timerValue: formatHeaderCountdown(30 - second),
      stateLabel: 'Bets closed',
      navStatusText: 'BETS CLOSED',
      accent: 'linear-gradient(135deg, #ff4757, #ff6b81)',
      pulseColor: '#ef4444',
      isLive: false,
    }
  }

  if (second < 50) {
    return {
      key: 'running',
      timerLabel: 'RACING LIVE',
      timerValue: null,
      stateLabel: 'Running',
      navStatusText: 'RUNNING',
      accent: 'linear-gradient(135deg, #22c55e, #16a34a)',
      pulseColor: '#22c55e',
      isLive: true,
    }
  }

  if (second < 55) {
    return {
      key: 'settlingBets',
      timerLabel: 'BETS OPEN IN',
      timerValue: formatHeaderCountdown(55 - second),
      stateLabel: 'Settling bets',
      navStatusText: 'SETTLING BETS',
      accent: 'linear-gradient(135deg, #f97316, #fb923c)',
      pulseColor: '#f97316',
      isLive: false,
    }
  }

  return {
    key: 'resetting',
    timerLabel: 'RESETTING',
    timerValue: formatHeaderCountdown(60 - second),
    stateLabel: 'Resetting',
    navStatusText: 'RESETTING',
    accent: 'linear-gradient(135deg, #64748b, #475569)',
    pulseColor: '#64748b',
    isLive: false,
  }
}

export function useRaceHeaderTiming() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timeoutId: number | undefined

    const scheduleNextTick = () => {
      const current = new Date()
      setNow(current)

      const delay = Math.max(25, 1000 - current.getUTCMilliseconds() + 8)
      timeoutId = window.setTimeout(scheduleNextTick, delay)
    }

    scheduleNextTick()

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  return getRaceHeaderTiming(now)
}
