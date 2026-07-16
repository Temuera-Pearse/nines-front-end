import React, { Suspense, createContext, useContext } from 'react'
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

export interface AppAuthContextValue {
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

export const defaultContextValue: AppAuthContextValue = {
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

export const AppAuthContext =
  createContext<AppAuthContextValue>(defaultContextValue)

const EnabledAppAuthProvider = AUTH0_CONFIG.isEnabled
  ? React.lazy(() =>
      import('./Auth0AppAuthProvider').then((module) => ({
        default: module.Auth0AppAuthProvider,
      })),
    )
  : null

export const AppAuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  if (!EnabledAppAuthProvider || !AUTH0_CONFIG.isEnabled) {
    return (
      <AppAuthContext.Provider value={defaultContextValue}>
        {children}
      </AppAuthContext.Provider>
    )
  }

  return (
    <Suspense
      fallback={
        <AppAuthContext.Provider value={defaultContextValue}>
          {children}
        </AppAuthContext.Provider>
      }
    >
      <EnabledAppAuthProvider>{children}</EnabledAppAuthProvider>
    </Suspense>
  )
}

export function useAppAuth(): AppAuthContextValue {
  return useContext(AppAuthContext)
}
