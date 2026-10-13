import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { NinesApiError } from '../api/apiError'
import { createNinesApiClient } from '../api/ninesApiClient'
import { createRequestId } from '../api/requestCorrelation'
import { useAppAuth } from '../auth/AppAuthProvider'
import { AUTH0_CONFIG } from '../auth/config'
import { PUBLIC_VIEWER_MODE } from '../config/features'
import { RaceStatus, useRaceStore } from '../state/raceStore'
import { getGameplayState, submitWager } from './api'
import { parseNinesToMinor } from './money'
import type { GameplayState, WagerResult } from './types'

type GameplayLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface PlayerGameplayContextValue {
  state: GameplayState | null
  status: GameplayLoadStatus
  error: string | null
  submitting: boolean
  lastSubmission: WagerResult | null
  refresh: () => Promise<void>
  placeWager: (selectionId: string, amount: string) => Promise<WagerResult>
}

const PlayerGameplayContext = createContext<PlayerGameplayContextValue | null>(null)

function errorMessage(error: unknown): string {
  if (error instanceof NinesApiError) return error.message
  return error instanceof Error ? error.message : 'Gameplay state could not be loaded'
}

export const PlayerGameplayProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { auth0SessionIsAuthenticated, getAccessToken, isLoading } = useAppAuth()
  const raceRef = useRaceStore((value) => value.raceRef)
  const raceStatus = useRaceStore((value) => value.status)
  const closesAt = useRaceStore((value) => value.betsCloseAtUtc)
  const client = useMemo(() => createNinesApiClient({ baseUrl: AUTH0_CONFIG.ninesApiUrl,
    getAccessToken }), [getAccessToken])
  const [state, setState] = useState<GameplayState | null>(null)
  const [status, setStatus] = useState<GameplayLoadStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lastSubmission, setLastSubmission] = useState<WagerResult | null>(null)
  const refreshSequence = useRef(0)
  const inFlight = useRef<{ raceRef: string | null; request: Promise<void> } | null>(null)
  const submissionInFlight = useRef(false)
  const retryKeys = useRef(new Map<string, string>())

  const enabled = !PUBLIC_VIEWER_MODE && !isLoading && auth0SessionIsAuthenticated

  const refresh = useCallback(async () => {
    if (!enabled) return
    if (inFlight.current?.raceRef === raceRef) return inFlight.current.request
    const sequence = ++refreshSequence.current
    setStatus((current) => current === 'idle' ? 'loading' : current)
    const request = getGameplayState(client, raceRef)
      .then((next) => {
        if (sequence !== refreshSequence.current) return
        setState(next)
        setStatus('ready')
        setError(null)
      })
      .catch((cause: unknown) => {
        if (sequence !== refreshSequence.current) return
        setStatus('error')
        setError(errorMessage(cause))
      })
    inFlight.current = { raceRef, request }
    try { await request } finally {
      if (inFlight.current?.request === request) inFlight.current = null
    }
  }, [client, enabled, raceRef])

  const placeWager = useCallback(async (selectionId: string, amount: string) => {
    if (!enabled) throw new Error('Sign in is required to place a wager')
    if (submissionInFlight.current) throw new Error('A wager submission is already in progress')
    if (!raceRef) throw new Error('No current race is available')
    if (raceStatus !== RaceStatus.BETS_OPEN || !closesAt || Date.now() >= Date.parse(closesAt)) {
      useRaceStore.getState().setStatus(RaceStatus.BETS_CLOSED)
      await refresh()
      throw new Error('Betting has closed for this race')
    }
    const stakeMinor = parseNinesToMinor(amount)
    if (state && BigInt(stakeMinor) > BigInt(state.balance.availableMinor)) {
      throw new Error('Stake exceeds your available NINES balance')
    }
    const fingerprint = `${raceRef}:${selectionId}:${stakeMinor}`
    const idempotencyKey = retryKeys.current.get(fingerprint) ?? createRequestId()
    retryKeys.current.set(fingerprint, idempotencyKey)
    submissionInFlight.current = true
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitWager(client, { raceRef, selectionId, stakeMinor, idempotencyKey })
      setLastSubmission(result)
      retryKeys.current.delete(fingerprint)
      await refresh()
      if (result.result === 'rejected') {
        if (result.rejectionCode?.toLowerCase().includes('close') ||
            result.rejectionCode?.toLowerCase().includes('window')) {
          useRaceStore.getState().setStatus(RaceStatus.BETS_CLOSED)
        }
        throw new Error(result.rejectionCode ?? 'The wager was rejected')
      }
      return result
    } catch (cause) {
      setError(errorMessage(cause))
      throw cause
    } finally {
      submissionInFlight.current = false
      setSubmitting(false)
    }
  }, [client, closesAt, enabled, raceRef, raceStatus, refresh, state])

  useEffect(() => {
    if (!enabled) { setState(null); setStatus('idle'); return }
    setLastSubmission(null)
    void refresh()
  }, [enabled, raceRef, refresh])

  useEffect(() => {
    if (!enabled) return
    const reconcile = () => { void refresh() }
    window.addEventListener('focus', reconcile)
    window.addEventListener('online', reconcile)
    return () => { window.removeEventListener('focus', reconcile); window.removeEventListener('online', reconcile) }
  }, [enabled, refresh])

  useEffect(() => {
    if (!enabled || (raceStatus !== RaceStatus.FINISHED && raceStatus !== RaceStatus.RESULTS)) return
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 1_500)
    return () => window.clearInterval(timer)
  }, [enabled, raceStatus, refresh])

  const value = useMemo(() => ({ state, status, error, submitting, lastSubmission,
    refresh, placeWager }), [state, status, error, submitting, lastSubmission, refresh, placeWager])
  return <PlayerGameplayContext.Provider value={value}>{children}</PlayerGameplayContext.Provider>
}

export function usePlayerGameplay(): PlayerGameplayContextValue {
  const value = useContext(PlayerGameplayContext)
  if (!value) throw new Error('usePlayerGameplay must be used within PlayerGameplayProvider')
  return value
}
