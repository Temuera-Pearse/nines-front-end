import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { AUTH0_CONFIG } from './config'

export interface NinesPlayerIdentity {
  userId: string
  authProvider: 'auth0'
  email?: string
  displayName: string
  roles: string[]
}

export interface AppAuthUser {
  name: string
  email?: string
  avatarUrl?: string
  player?: NinesPlayerIdentity
}

interface AppAuthContextValue {
  isEnabled: boolean
  isLoading: boolean
  auth0SessionIsAuthenticated: boolean
  hasConfirmedPlayer: boolean
  isPlayerVerificationLoading: boolean
  authFlowError: string | null
  playerVerificationError: string | null
  /** Compatibility alias. Private UI must use hasConfirmedPlayer. */
  isAuthenticated: boolean
  user: AppAuthUser | null
  player: NinesPlayerIdentity | null
  login: () => Promise<void>
  signup: () => Promise<void>
  logout: () => void
}

const noopAsync = async () => {}
const noop = () => {}

const defaultContextValue: AppAuthContextValue = {
  isEnabled: AUTH0_CONFIG.isEnabled,
  isLoading: false,
  auth0SessionIsAuthenticated: false,
  hasConfirmedPlayer: false,
  isPlayerVerificationLoading: false,
  authFlowError: null,
  playerVerificationError: null,
  isAuthenticated: false,
  user: null,
  player: null,
  login: noopAsync,
  signup: noopAsync,
  logout: noop,
}

const AppAuthContext = createContext<AppAuthContextValue>(defaultContextValue)

type PlayerVerificationState =
  | { status: 'idle' | 'loading'; player: null; error: null }
  | { status: 'confirmed'; player: NinesPlayerIdentity; error: null }
  | { status: 'failed'; player: null; error: string }

async function fetchNinesPlayerIdentity(
  accessToken: string,
): Promise<NinesPlayerIdentity> {
  if (!AUTH0_CONFIG.ninesApiUrl) {
    throw new Error('VITE_NINES_API_URL is required for Nines API auth')
  }

  const baseUrl = AUTH0_CONFIG.ninesApiUrl.endsWith('/')
    ? AUTH0_CONFIG.ninesApiUrl.slice(0, -1)
    : AUTH0_CONFIG.ninesApiUrl

  const response = await fetch(`${baseUrl}/auth/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Nines API auth check failed (${response.status})`)
  }

  const payload = (await response.json()) as Partial<NinesPlayerIdentity>
  const roles = payload.roles
  const hasValidRoles =
    Array.isArray(roles) && roles.every((role) => typeof role === 'string')

  if (
    typeof payload.userId !== 'string' ||
    payload.authProvider !== 'auth0' ||
    typeof payload.displayName !== 'string' ||
    !hasValidRoles ||
    (payload.email !== undefined && typeof payload.email !== 'string')
  ) {
    throw new Error('Nines API auth check returned an invalid player identity')
  }

  return {
    userId: payload.userId,
    authProvider: payload.authProvider,
    displayName: payload.displayName,
    roles: roles as string[],
    ...(payload.email ? { email: payload.email } : {}),
  }
}

const AuthStateBridge: React.FC<React.PropsWithChildren> = ({ children }) => {
  const {
    getAccessTokenSilently,
    error,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    user,
  } = useAuth0()
  const [playerVerification, setPlayerVerification] =
    useState<PlayerVerificationState>({
      status: 'idle',
      player: null,
      error: null,
    })

  useEffect(() => {
    let cancelled = false

    if (!isAuthenticated) {
      setPlayerVerification({
        status: 'idle',
        player: null,
        error: null,
      })
      return () => {
        cancelled = true
      }
    }

    setPlayerVerification({
      status: 'loading',
      player: null,
      error: null,
    })

    ;(async () => {
      try {
        const accessToken = await getAccessTokenSilently({
          authorizationParams: {
            audience: AUTH0_CONFIG.audience,
          },
        })
        const playerIdentity = await fetchNinesPlayerIdentity(accessToken)
        if (!cancelled) {
          setPlayerVerification({
            status: 'confirmed',
            player: playerIdentity,
            error: null,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setPlayerVerification({
            status: 'failed',
            player: null,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to confirm Nines player session',
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [getAccessTokenSilently, isAuthenticated])

  const player = playerVerification.player
  const auth0SessionIsAuthenticated = isAuthenticated
  const hasConfirmedPlayer =
    auth0SessionIsAuthenticated &&
    playerVerification.status === 'confirmed' &&
    player !== null &&
    player.roles.includes('player')
  const isPlayerVerificationLoading =
    auth0SessionIsAuthenticated &&
    (playerVerification.status === 'idle' ||
      playerVerification.status === 'loading')
  const playerVerificationError =
    playerVerification.status === 'failed' ? playerVerification.error : null
  const authFlowError = error?.message ?? null

  const appUser = useMemo<AppAuthUser | null>(() => {
    if (!hasConfirmedPlayer || !player) return null

    return {
      name: player.displayName,
      email: player.email ?? user?.email,
      avatarUrl: user?.picture,
      player,
    }
  }, [hasConfirmedPlayer, player, user])

  const contextValue: AppAuthContextValue = {
    isEnabled: true,
    isLoading,
    auth0SessionIsAuthenticated,
    hasConfirmedPlayer,
    isPlayerVerificationLoading,
    authFlowError,
    playerVerificationError,
    isAuthenticated: hasConfirmedPlayer,
    user: appUser,
    player,
    login: () =>
      loginWithRedirect({
        authorizationParams: {
          audience: AUTH0_CONFIG.audience,
        },
      }),
    signup: () =>
      loginWithRedirect({
        authorizationParams: {
          audience: AUTH0_CONFIG.audience,
          screen_hint: 'signup',
        },
      }),
    logout: () =>
      logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      }),
  }

  return (
    <AppAuthContext.Provider value={contextValue}>
      {children}
    </AppAuthContext.Provider>
  )
}

export const AppAuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  if (!AUTH0_CONFIG.isEnabled) {
    return (
      <AppAuthContext.Provider value={defaultContextValue}>
        {children}
      </AppAuthContext.Provider>
    )
  }

  return (
    <Auth0Provider
      domain={AUTH0_CONFIG.domain}
      clientId={AUTH0_CONFIG.clientId}
      cacheLocation={AUTH0_CONFIG.cacheLocation}
      onRedirectCallback={() => {
        window.history.replaceState({}, document.title, window.location.origin)
      }}
      authorizationParams={{
        audience: AUTH0_CONFIG.audience,
        redirect_uri: `${window.location.origin}/callback`,
      }}
    >
      <AuthStateBridge>{children}</AuthStateBridge>
    </Auth0Provider>
  )
}

export function useAppAuth(): AppAuthContextValue {
  return useContext(AppAuthContext)
}
