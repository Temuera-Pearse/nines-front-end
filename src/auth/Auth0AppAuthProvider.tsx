import React, { useCallback, useMemo } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import {
  AppAuthContext,
  type AppAuthContextValue,
  type AppAuthUser,
} from './AppAuthProvider'
import { AUTH0_CONFIG } from './config'

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
  const auth0SessionIsAuthenticated = isAuthenticated
  const hasConfirmedPlayer = auth0SessionIsAuthenticated
  const authFlowError = error?.message ?? null
  const getAccessToken = useCallback(
    () =>
      getAccessTokenSilently({
        authorizationParams: {
          audience: AUTH0_CONFIG.audience,
          scope: 'openid profile email',
        },
      }),
    [getAccessTokenSilently],
  )
  const login = useCallback(
    () =>
      loginWithRedirect({
        authorizationParams: {
          audience: AUTH0_CONFIG.audience,
          scope: 'openid profile email',
        },
      }),
    [loginWithRedirect],
  )
  const signup = useCallback(
    () =>
      loginWithRedirect({
        authorizationParams: {
          audience: AUTH0_CONFIG.audience,
          scope: 'openid profile email',
          screen_hint: 'signup',
        },
      }),
    [loginWithRedirect],
  )
  const logoutFromApp = useCallback(
    () =>
      logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      }),
    [logout],
  )

  const appUser = useMemo<AppAuthUser | null>(() => {
    if (!isAuthenticated) return null

    return {
      name: user?.name ?? user?.email ?? 'Nines player',
      email: user?.email,
      avatarUrl: user?.picture,
    }
  }, [isAuthenticated, user])

  const contextValue = useMemo<AppAuthContextValue>(
    () => ({
      isEnabled: true,
      isLoading,
      auth0SessionIsAuthenticated,
      hasConfirmedPlayer,
      isPlayerVerificationLoading: false,
      authFlowError,
      playerVerificationError: null,
      isAuthenticated: hasConfirmedPlayer,
      user: appUser,
      player: null,
      getAccessToken,
      login,
      signup,
      logout: logoutFromApp,
    }),
    [
      appUser,
      auth0SessionIsAuthenticated,
      authFlowError,
      getAccessToken,
      hasConfirmedPlayer,
      isLoading,
      login,
      logoutFromApp,
      signup,
    ],
  )

  return (
    <AppAuthContext.Provider value={contextValue}>
      {children}
    </AppAuthContext.Provider>
  )
}

export const Auth0AppAuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <Auth0Provider
    domain={AUTH0_CONFIG.domain}
    clientId={AUTH0_CONFIG.clientId}
    cacheLocation={AUTH0_CONFIG.cacheLocation}
    onRedirectCallback={() => {
      window.history.replaceState({}, document.title, window.location.origin)
    }}
    authorizationParams={{
      audience: AUTH0_CONFIG.audience,
      scope: 'openid profile email',
      redirect_uri: `${window.location.origin}/callback`,
    }}
  >
    <AuthStateBridge>{children}</AuthStateBridge>
  </Auth0Provider>
)
