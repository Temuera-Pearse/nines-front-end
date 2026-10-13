import { useEffect, useState } from 'react'
import { RaceStatus, useRaceStore } from './raceStore'

export type RaceHeaderPhaseKey =
  | 'betsOpen'
  | 'betsClosed'
  | 'running'
  | 'settlingBets'
  | 'resetting'

export interface RaceHeaderTiming {
  key: RaceHeaderPhaseKey
  timerLabel: 'STARTS IN' | 'RACING LIVE' | 'NEXT RACE IN' | 'RESETTING'
  timerValue: string | null
  stateLabel:
    | 'Getting ready'
    | 'Race staging'
    | 'Running'
    | 'Results soon'
    | 'Resetting'
  navStatusText:
    | 'GETTING READY'
    | 'RACE STAGING'
    | 'RUNNING'
    | 'RESULTS SOON'
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
      stateLabel: 'Getting ready',
      navStatusText: 'GETTING READY',
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
      stateLabel: 'Race staging',
      navStatusText: 'RACE STAGING',
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
      timerLabel: 'NEXT RACE IN',
      timerValue: formatHeaderCountdown(55 - second),
      stateLabel: 'Results soon',
      navStatusText: 'RESULTS SOON',
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
  const status = useRaceStore((state) => state.status)
  const closesAt = useRaceStore((state) => state.betsCloseAtUtc)
  const resultsVisibleUntil = useRaceStore((state) => state.resultsVisibleUntilUtc)
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

  if (status === RaceStatus.BETS_OPEN) {
    const seconds = closesAt
      ? Math.max(0, Math.ceil((Date.parse(closesAt) - now.getTime()) / 1000))
      : 0
    return { ...getRaceHeaderTiming(new Date('2000-01-01T00:00:00.000Z')),
      timerValue: formatHeaderCountdown(seconds) }
  }
  if (status === RaceStatus.BETS_CLOSED) {
    return getRaceHeaderTiming(new Date('2000-01-01T00:00:28.000Z'))
  }
  if (status === RaceStatus.RUNNING) {
    return getRaceHeaderTiming(new Date('2000-01-01T00:00:35.000Z'))
  }
  if (status === RaceStatus.FINISHED || status === RaceStatus.RESULTS) {
    const fallback = getRaceHeaderTiming(new Date('2000-01-01T00:00:52.000Z'))
    const seconds = resultsVisibleUntil
      ? Math.max(0, Math.ceil((Date.parse(resultsVisibleUntil) - now.getTime()) / 1000))
      : 0
    return { ...fallback, timerValue: formatHeaderCountdown(seconds) }
  }
  return getRaceHeaderTiming(new Date('2000-01-01T00:00:58.000Z'))
}
