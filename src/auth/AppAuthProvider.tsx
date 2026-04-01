import React, { createContext, useContext } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { AUTH0_CONFIG } from './config'

interface AppAuthUser {
  name: string
  email?: string
  avatarUrl?: string
}

interface AppAuthContextValue {
  isEnabled: boolean
  isLoading: boolean
  isAuthenticated: boolean
  user: AppAuthUser | null
  login: () => Promise<void>
  signup: () => Promise<void>
  logout: () => void
}

const noopAsync = async () => {}
const noop = () => {}

const defaultContextValue: AppAuthContextValue = {
  isEnabled: AUTH0_CONFIG.isEnabled,
  isLoading: false,
  isAuthenticated: false,
  user: null,
  login: noopAsync,
  signup: noopAsync,
  logout: noop,
}

const AppAuthContext = createContext<AppAuthContextValue>(defaultContextValue)

const AuthStateBridge: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } =
    useAuth0()

  const contextValue: AppAuthContextValue = {
    isEnabled: true,
    isLoading,
    isAuthenticated,
    user: user
      ? {
          name: user.name ?? user.nickname ?? user.email ?? 'Nines Player',
          email: user.email,
          avatarUrl: user.picture,
        }
      : null,
    login: () => loginWithRedirect(),
    signup: () =>
      loginWithRedirect({
        authorizationParams: {
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
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <AuthStateBridge>{children}</AuthStateBridge>
    </Auth0Provider>
  )
}

export function useAppAuth(): AppAuthContextValue {
  return useContext(AppAuthContext)
}
