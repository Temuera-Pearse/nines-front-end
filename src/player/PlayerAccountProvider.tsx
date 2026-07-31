import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { NinesApiError } from '../api/apiError'
import { createNinesApiClient } from '../api/ninesApiClient'
import { createRequestId } from '../api/requestCorrelation'
import { useAppAuth } from '../auth/AppAuthProvider'
import { AUTH0_CONFIG } from '../auth/config'
import {
  IS_DEVELOPMENT,
  KYC_UI_ENABLED,
  PUBLIC_VIEWER_MODE,
} from '../config/features'
import { getKycProfile } from '../kyc/api/getKycProfile'
import { startKycSession } from '../kyc/api/startKycSession'
import type { KycProfile } from '../kyc/domain/KycProfile'
import type { StartedKycSession } from '../kyc/domain/KycSession'
import {
  KycPopupBlockedError,
  monitorKycPopup,
  reserveKycPopup,
  type KycPopupResult,
  type KycPopupStatus,
  type KycPopupWindow,
} from '../kyc/popup/kycPopup'
import { getCurrentPlayer } from './api/getCurrentPlayer'
import type { CurrentPlayer } from './domain/CurrentPlayer'

export type AccountResourceStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'unauthenticated'
  | 'forbidden'
  | 'error'

export interface AccountResource<T> {
  status: AccountResourceStatus
  data: T | null
  error: unknown
  isRefreshing: boolean
}

interface PlayerAccountContextValue {
  player: AccountResource<CurrentPlayer>
  kyc: AccountResource<KycProfile>
  kycUiEnabled: boolean
  isStartingKyc: boolean
  startKycError: unknown
  lastStartedSession: StartedKycSession | null
  kycPopupStatus: KycPopupStatus
  kycPopupError: unknown
  refreshPlayer: () => Promise<void>
  refreshKyc: () => Promise<void>
  refreshAll: () => Promise<void>
  startOrResumeKyc: () => Promise<StartedKycSession>
  openKycSession: (session: {
    sessionId: string
    verificationUrl: string | null
  }) => Promise<KycPopupResult>
}

const emptyResource = <T,>(): AccountResource<T> => ({
  status: 'idle',
  data: null,
  error: null,
  isRefreshing: false,
})

const PlayerAccountContext = createContext<PlayerAccountContextValue | null>(
  null,
)

function statusForError(error: unknown): AccountResourceStatus {
  if (error instanceof NinesApiError && error.category === 'authentication') {
    return 'unauthenticated'
  }
  if (error instanceof NinesApiError && error.category === 'eligibility') {
    return 'forbidden'
  }
  return 'error'
}

export const PlayerAccountProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const {
    auth0SessionIsAuthenticated,
    getAccessToken,
    isEnabled,
    isLoading: isAuthLoading,
  } = useAppAuth()
  const mayLoadProtectedData =
    isEnabled &&
    !PUBLIC_VIEWER_MODE &&
    !isAuthLoading &&
    auth0SessionIsAuthenticated
  const client = useMemo(
    () =>
      isEnabled
        ? createNinesApiClient({
            baseUrl: AUTH0_CONFIG.ninesApiUrl,
            getAccessToken,
          })
        : null,
    [getAccessToken, isEnabled],
  )
  const [player, setPlayer] =
    useState<AccountResource<CurrentPlayer>>(emptyResource)
  const [kyc, setKyc] = useState<AccountResource<KycProfile>>(emptyResource)
  const [isStartingKyc, setIsStartingKyc] = useState(false)
  const [startKycError, setStartKycError] = useState<unknown>(null)
  const [lastStartedSession, setLastStartedSession] =
    useState<StartedKycSession | null>(null)
  const [kycPopupStatus, setKycPopupStatus] =
    useState<KycPopupStatus>('idle')
  const [kycPopupError, setKycPopupError] = useState<unknown>(null)
  const playerAbortRef = useRef<AbortController | null>(null)
  const kycAbortRef = useRef<AbortController | null>(null)
  const playerRequestRef = useRef<Promise<void> | null>(null)
  const kycRequestRef = useRef<Promise<void> | null>(null)
  const startRequestRef = useRef<Promise<StartedKycSession> | null>(null)
  const popupRequestRef = useRef<Promise<KycPopupResult> | null>(null)
  const startAbortRef = useRef<AbortController | null>(null)
  const popupAbortRef = useRef<AbortController | null>(null)
  const playerGenerationRef = useRef(0)
  const kycGenerationRef = useRef(0)
  const startGenerationRef = useRef(0)
  const idempotencyKeyRef = useRef<string | null>(null)

  const refreshPlayer = useCallback(async () => {
    if (!client || !mayLoadProtectedData) return
    if (playerRequestRef.current) return playerRequestRef.current

    playerAbortRef.current?.abort()
    const controller = new AbortController()
    const generation = ++playerGenerationRef.current
    playerAbortRef.current = controller
    setPlayer((current) => ({
      ...current,
      status: current.data ? 'success' : 'loading',
      error: null,
      isRefreshing: current.data !== null,
    }))

    const request = getCurrentPlayer(client, controller.signal)
      .then((data) => {
        if (
          controller.signal.aborted ||
          playerGenerationRef.current !== generation
        ) {
          return
        }
        setPlayer({
          status: 'success',
          data,
          error: null,
          isRefreshing: false,
        })
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          playerGenerationRef.current !== generation
        ) {
          return
        }
        setPlayer((current) => ({
          status: statusForError(error),
          data: current.data,
          error,
          isRefreshing: false,
        }))
      })
      .finally(() => {
        if (
          playerAbortRef.current === controller &&
          playerGenerationRef.current === generation
        ) {
          playerAbortRef.current = null
          playerRequestRef.current = null
        }
      })

    playerRequestRef.current = request
    return request
  }, [client, mayLoadProtectedData])

  const refreshKyc = useCallback(async () => {
    if (!client || !mayLoadProtectedData || !KYC_UI_ENABLED) return
    if (kycRequestRef.current) return kycRequestRef.current

    kycAbortRef.current?.abort()
    const controller = new AbortController()
    const generation = ++kycGenerationRef.current
    kycAbortRef.current = controller
    setKyc((current) => ({
      ...current,
      status: current.data ? 'success' : 'loading',
      error: null,
      isRefreshing: current.data !== null,
    }))

    const request = getKycProfile(client, controller.signal)
      .then((data) => {
        if (
          controller.signal.aborted ||
          kycGenerationRef.current !== generation
        ) {
          return
        }
        setKyc({
          status: 'success',
          data,
          error: null,
          isRefreshing: false,
        })
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          kycGenerationRef.current !== generation
        ) {
          return
        }
        setKyc((current) => ({
          status: statusForError(error),
          data: current.data,
          error,
          isRefreshing: false,
        }))
      })
      .finally(() => {
        if (
          kycAbortRef.current === controller &&
          kycGenerationRef.current === generation
        ) {
          kycAbortRef.current = null
          kycRequestRef.current = null
        }
      })

    kycRequestRef.current = request
    return request
  }, [client, mayLoadProtectedData])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshPlayer(), refreshKyc()])
  }, [refreshKyc, refreshPlayer])

  const monitorReservedPopup = useCallback(
    (
      session: {
        sessionId: string
        verificationUrl: string | null
      },
      popup: KycPopupWindow,
    ): Promise<KycPopupResult> => {
      if (!session.verificationUrl) {
        popup.close()
        const error = new Error(
          'The verification provider did not return a hosted URL.',
        )
        setKycPopupStatus('error')
        setKycPopupError(error)
        return Promise.reject(error)
      }
      const controller = new AbortController()
      popupAbortRef.current = controller
      setKycPopupStatus('open')
      setKycPopupError(null)
      const request = monitorKycPopup({
        popup,
        sessionId: session.sessionId,
        verificationUrl: session.verificationUrl,
        allowInsecureDevelopmentUrl: IS_DEVELOPMENT,
        signal: controller.signal,
      })
        .then(async (result) => {
          if (result.status === 'completed') {
            setKycPopupStatus('completed')
            await refreshAll()
          } else {
            setKycPopupStatus(result.status)
          }
          return result
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) throw error
          setKycPopupStatus('error')
          setKycPopupError(error)
          throw error
        })
        .finally(() => {
          if (popupAbortRef.current === controller) {
            popupAbortRef.current = null
            popupRequestRef.current = null
          }
        })
      popupRequestRef.current = request
      return request
    },
    [refreshAll],
  )

  const reservePopup = useCallback((): KycPopupWindow => {
    setKycPopupStatus('opening')
    setKycPopupError(null)
    try {
      return reserveKycPopup()
    } catch (error) {
      setKycPopupStatus(
        error instanceof KycPopupBlockedError ? 'blocked' : 'error',
      )
      setKycPopupError(error)
      throw error
    }
  }, [])

  const openKycSession = useCallback(
    (session: {
      sessionId: string
      verificationUrl: string | null
    }): Promise<KycPopupResult> => {
      if (popupRequestRef.current) return popupRequestRef.current
      return monitorReservedPopup(session, reservePopup())
    },
    [monitorReservedPopup, reservePopup],
  )

  const startOrResumeKyc = useCallback(async () => {
    if (!client || !mayLoadProtectedData || !KYC_UI_ENABLED) {
      throw new Error('KYC verification is unavailable')
    }
    if (
      player.status !== 'success' ||
      player.data?.permissions.startKyc !== true
    ) {
      throw new Error('KYC verification is not available for this account')
    }
    if (startRequestRef.current) return startRequestRef.current
    const popup = reservePopup()
    const idempotencyKey =
      idempotencyKeyRef.current ?? `kyc-session-${createRequestId()}`
    idempotencyKeyRef.current = idempotencyKey
    const controller = new AbortController()
    const generation = ++startGenerationRef.current
    startAbortRef.current = controller
    setIsStartingKyc(true)
    setStartKycError(null)

    const request = startKycSession(
      client,
      idempotencyKey,
      controller.signal,
    )
      .then(async (session) => {
        if (
          controller.signal.aborted ||
          startGenerationRef.current !== generation
        ) {
          throw new DOMException('The request was aborted', 'AbortError')
        }
        setLastStartedSession(session)
        setIsStartingKyc(false)
        idempotencyKeyRef.current = null
        await Promise.all([
          refreshAll(),
          monitorReservedPopup(session, popup),
        ])
        return session
      })
      .catch(async (error: unknown) => {
        if (
          controller.signal.aborted ||
          startGenerationRef.current !== generation
        ) {
          throw error
        }
        popup.close()
        setStartKycError(error)
        if (error instanceof NinesApiError && error.category === 'conflict') {
          await refreshAll()
        }
        throw error
      })
      .finally(() => {
        if (
          startAbortRef.current === controller &&
          startGenerationRef.current === generation
        ) {
          setIsStartingKyc(false)
          startAbortRef.current = null
          startRequestRef.current = null
        }
      })

    startRequestRef.current = request
    return request
  }, [
    client,
    mayLoadProtectedData,
    monitorReservedPopup,
    player.data,
    player.status,
    refreshAll,
    reservePopup,
  ])

  useEffect(() => {
    if (mayLoadProtectedData) {
      void refreshAll()
      return () => {
        playerAbortRef.current?.abort()
        kycAbortRef.current?.abort()
        startAbortRef.current?.abort()
        popupAbortRef.current?.abort()
        playerGenerationRef.current += 1
        kycGenerationRef.current += 1
        startGenerationRef.current += 1
        playerAbortRef.current = null
        kycAbortRef.current = null
        startAbortRef.current = null
        popupAbortRef.current = null
        playerRequestRef.current = null
        kycRequestRef.current = null
        startRequestRef.current = null
        popupRequestRef.current = null
      }
    }
    playerAbortRef.current?.abort()
    kycAbortRef.current?.abort()
    startAbortRef.current?.abort()
    popupAbortRef.current?.abort()
    playerGenerationRef.current += 1
    kycGenerationRef.current += 1
    startGenerationRef.current += 1
    playerAbortRef.current = null
    kycAbortRef.current = null
    startAbortRef.current = null
    popupAbortRef.current = null
    playerRequestRef.current = null
    kycRequestRef.current = null
    startRequestRef.current = null
    popupRequestRef.current = null
    setPlayer(emptyResource())
    setKyc(emptyResource())
    setIsStartingKyc(false)
    setLastStartedSession(null)
    setStartKycError(null)
    setKycPopupStatus('idle')
    setKycPopupError(null)
    idempotencyKeyRef.current = null
    return undefined
  }, [mayLoadProtectedData, refreshAll])

  const value = useMemo<PlayerAccountContextValue>(
    () => ({
      player,
      kyc,
      kycUiEnabled: KYC_UI_ENABLED,
      isStartingKyc,
      startKycError,
      lastStartedSession,
      kycPopupStatus,
      kycPopupError,
      refreshPlayer,
      refreshKyc,
      refreshAll,
      startOrResumeKyc,
      openKycSession,
    }),
    [
      isStartingKyc,
      kyc,
      kycPopupError,
      kycPopupStatus,
      lastStartedSession,
      player,
      openKycSession,
      refreshAll,
      refreshKyc,
      refreshPlayer,
      startKycError,
      startOrResumeKyc,
    ],
  )

  return (
    <PlayerAccountContext.Provider value={value}>
      {children}
    </PlayerAccountContext.Provider>
  )
}

export function usePlayerAccount(): PlayerAccountContextValue {
  const value = useContext(PlayerAccountContext)
  if (!value) {
    throw new Error('usePlayerAccount must be used within PlayerAccountProvider')
  }
  return value
}
