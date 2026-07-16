import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url).pathname
const read = (path) => readFileSync(join(root, path), 'utf8')

function confirmedPlayerAccess({
  auth0SessionIsAuthenticated,
  verificationStatus,
  roles = [],
}) {
  return (
    auth0SessionIsAuthenticated &&
    verificationStatus === 'confirmed' &&
    roles.includes('player')
  )
}

describe('confirmed player access rule', () => {
  const main = read('src/main.tsx')
  const authProvider = read('src/auth/AppAuthProvider.tsx')
  const auth0Provider = read('src/auth/Auth0AppAuthProvider.tsx')
  const authConfig = read('src/auth/config.ts')
  const features = read('src/config/features.ts')
  const disabledRoutes = read('src/config/disabledRoutes.ts')
  const envExample = read('.env.example')
  const publicHeader = read('src/components/Header/PublicHeader.tsx')
  const viteConfig = read('vite.config.ts')
  const mediaQueryHook = read('src/hooks/useMediaQuery.ts')
  const gitignore = read('.gitignore')

  it('denies logged-out, pending, failed, and non-player sessions', () => {
    assert.equal(
      confirmedPlayerAccess({
        auth0SessionIsAuthenticated: false,
        verificationStatus: 'idle',
      }),
      false,
    )
    assert.equal(
      confirmedPlayerAccess({
        auth0SessionIsAuthenticated: true,
        verificationStatus: 'loading',
      }),
      false,
    )
    assert.equal(
      confirmedPlayerAccess({
        auth0SessionIsAuthenticated: true,
        verificationStatus: 'failed',
      }),
      false,
    )
    assert.equal(
      confirmedPlayerAccess({
        auth0SessionIsAuthenticated: true,
        verificationStatus: 'confirmed',
        roles: ['spectator'],
      }),
      false,
    )
  })

  it('allows only an Auth0 session confirmed as a Nines player', () => {
    assert.equal(
      confirmedPlayerAccess({
        auth0SessionIsAuthenticated: true,
        verificationStatus: 'confirmed',
        roles: ['player'],
      }),
      true,
    )
  })

  it('implements the same rule in the auth provider', () => {
    assert.match(
      authProvider,
      /Auth0AppAuthProvider/,
    )
    assert.match(
      auth0Provider,
      /const hasConfirmedPlayer\s*=\s*auth0SessionIsAuthenticated\s*&&\s*playerVerification\.status === 'confirmed'\s*&&\s*player !== null\s*&&\s*player\.roles\.includes\('player'\)/s,
    )
    assert.match(
      auth0Provider,
      /const isPlayerVerificationLoading\s*=\s*auth0SessionIsAuthenticated\s*&&\s*\(playerVerification\.status === 'idle'\s*\|\|\s*playerVerification\.status === 'loading'\)/s,
    )
    assert.match(
      auth0Provider,
      /isAuthenticated:\s*hasConfirmedPlayer/,
    )
    assert.match(
      auth0Provider,
      /Nines API auth check returned an invalid player identity/,
    )
  })

  it('requires and requests the custom Nines API audience', () => {
    assert.match(
      envExample,
      /^VITE_AUTH0_AUDIENCE=$/m,
    )
    assert.match(
      authConfig,
      /audience\.length > 0[\s\S]*ninesApiUrl\.length > 0/s,
    )
    assert.match(
      auth0Provider,
      /getAccessTokenSilently\(\{\s*authorizationParams: \{\s*audience: AUTH0_CONFIG\.audience/s,
    )
  })

  it('defaults production public viewer builds to auth disabled', () => {
    assert.match(features, /export const PUBLIC_VIEWER_MODE\s*=[\s\S]*IS_PRODUCTION \? true : false/)
    assert.match(features, /export const FRONTEND_AUTH_ENABLED\s*=[\s\S]*!PUBLIC_VIEWER_MODE/)
    assert.match(features, /IS_PRODUCTION \? false : true/)
    assert.match(authConfig, /isEnabled: FRONTEND_AUTH_ENABLED && hasCompleteAuth0Config/)
    assert.match(envExample, /^VITE_PUBLIC_VIEWER_MODE=true$/m)
    assert.match(envExample, /^VITE_AUTH_ENABLED=false$/m)
  })

  it('uses same-origin Vite proxies for browser REST/auth requests and the configured WebSocket', () => {
    assert.match(
      envExample,
      /^VITE_DEV_PROXY_TARGET=https:\/\/example-race-api\.invalid$/m,
    )
    assert.match(
      envExample,
      /^VITE_NINES_BACKEND_URL=https:\/\/example-race-api\.invalid$/m,
    )
    assert.match(envExample, /^VITE_NINES_API_URL=$/m)
    assert.doesNotMatch(envExample, /^VITE_NINES_API_URL=http:\/\/localhost/m)
    assert.match(envExample, /^NINES_API_PROXY_TARGET=http:\/\/127\.0\.0\.1:3002$/m)
    assert.match(viteConfig, /const ninesApiProxyTarget = env\.NINES_API_PROXY_TARGET \|\| proxyTarget/)
    assert.match(viteConfig, /'\/auth':\s*{\s*target: ninesApiProxyTarget/s)
    assert.match(
      envExample,
      /^VITE_NINES_WS_URL=wss:\/\/example-race-api\.invalid\/ws$/m,
    )
  })

  it('serves LAN development over mkcert-backed HTTPS', () => {
    assert.match(gitignore, /^\.certs\/$/m)
    assert.match(viteConfig, /readLocalHttpsConfig/)
    assert.match(viteConfig, /\.certs\/nines-local\.pem/)
    assert.match(viteConfig, /\.certs\/nines-local-key\.pem/)
    assert.match(
      viteConfig,
      /https: command === 'serve' \? readLocalHttpsConfig\(\) : undefined/,
    )
  })

  it('wraps React startup in an error boundary instead of white-screening', () => {
    assert.match(main, /<AppErrorBoundary>/)
    assert.match(main, /<AppAuthProvider>/)
    assert.match(
      read('src/components/ErrorBoundary/AppErrorBoundary.tsx'),
      /Nines could not start/,
    )
  })

  it('guards mobile media query APIs for older Safari', () => {
    assert.match(mediaQueryHook, /!window\.matchMedia/)
    assert.match(mediaQueryHook, /mediaQuery\.addListener\(handleChange\)/)
    assert.match(mediaQueryHook, /mediaQuery\.removeListener\(handleChange\)/)
  })

  it('shows Auth0 and player verification failures instead of silently reloading', () => {
    assert.match(authProvider, /authFlowError:\s*string \| null/)
    assert.match(auth0Provider, /const authFlowError = error\?\.message \?\? null/)
    assert.match(
      publicHeader,
      /Nines service unavailable: \{visibleAuthError\}/,
    )
  })

  it('does not render public login and register header actions', () => {
    assert.doesNotMatch(publicHeader, /nines-header-public-actions/)
    assert.doesNotMatch(publicHeader, />\s*Login\s*</)
    assert.doesNotMatch(publicHeader, />\s*Register\s*</)
    assert.doesNotMatch(publicHeader, /void login\(\)/)
    assert.doesNotMatch(publicHeader, /void signup\(\)/)
  })

  it('redirects disabled auth and private routes before auth can start', () => {
    assert.match(main, /redirectDisabledFrontendRoute\(\)/)
    for (const route of [
      '/login',
      '/register',
      '/signup',
      '/callback',
      '/account',
      '/profile',
      '/settings',
      '/wallet',
      '/bets',
      '/history',
      '/transactions',
      '/deposit',
      '/withdraw',
      '/admin',
    ]) {
      assert.match(disabledRoutes, new RegExp(`'${route}'`))
    }
    assert.match(
      disabledRoutes,
      /if \(FRONTEND_AUTH_ENABLED && !PUBLIC_VIEWER_MODE\) return false/,
    )
    assert.match(
      disabledRoutes,
      /window\.history\.replaceState\(\{\}, document\.title, '\/'\)/,
    )
  })
})

describe('private component rendering boundaries', () => {
  const app = read('src/App.tsx')
  const desktopLayout = read('src/layouts/desktop/DesktopLayout.tsx')
  const mobileLayout = read('src/layouts/mobile/MobileLayout.tsx')
  const mobileSelectionSheet = read(
    'src/layouts/mobile/MobileSelectionSheet.tsx',
  )
  const headerGate = read('src/components/Header/HeaderGate.tsx')
  const bettingModel = read(
    'src/components/BettingArea/useBettingAreaModel.ts',
  )
  const bettingPanel = read('src/components/BettingArea/BettingPanel.tsx')
  const betStore = read('src/state/betStore.ts')

  it('keeps the guest spectator race viewer and leaderboard outside the player gate', () => {
    assert.match(
      desktopLayout,
      /<div className="nines-race-track-panel">\s*<RaceTrack[\s\S]*?<\/div>[\s\S]*?<div className="nines-race-betting">[\s\S]*?<LiveRaceLeaderboard \/>/s,
    )
    assert.match(desktopLayout, /<ResultsPanel/)
    assert.match(desktopLayout, /<OnTrackEventsCard \/>/)
    assert.match(desktopLayout, /<BottomWidgets \/>/)
    assert.match(mobileLayout, /<RaceTrack/)
  })

  it('gates private app components independently of viewport size', () => {
    assert.match(
      desktopLayout,
      /const PrivateCompactRaceInfo = !PUBLIC_VIEWER_MODE[\s\S]*?import\('\.\.\/\.\.\/components\/NewLayout\/CompactRaceInfo'\)/s,
    )
    assert.match(
      desktopLayout,
      /\{PrivateCompactRaceInfo && hasConfirmedPlayer && !PUBLIC_VIEWER_MODE \?\s*\(\s*<div className="nines-race-mobile-status">[\s\S]*?<PrivateCompactRaceInfo \/>[\s\S]*?<\/div>\s*\)\s*: null\}/s,
    )
    assert.match(
      mobileLayout,
      /const PrivateMobileSelectionSheet = !PUBLIC_VIEWER_MODE[\s\S]*?import\('\.\/MobileSelectionSheet'\)/s,
    )
    assert.match(
      mobileLayout,
      /\{PrivateCompactRaceInfo && hasConfirmedPlayer && !PUBLIC_VIEWER_MODE \?\s*\(\s*<div className="nines-mobile-layout__status">[\s\S]*?<PrivateCompactRaceInfo \/>[\s\S]*?<\/div>\s*\)\s*: null\}/s,
    )
    assert.match(
      mobileLayout,
      /\{PrivateMobileSelectionSheet && hasConfirmedPlayer && !PUBLIC_VIEWER_MODE \?\s*\(\s*<Suspense fallback=\{null\}>[\s\S]*?<PrivateMobileSelectionSheet timing=\{timing\} \/>[\s\S]*?<\/Suspense>\s*\)\s*: null\}/s,
    )
    assert.match(mobileSelectionSheet, /useBettingAreaModel\(\)/)
    assert.match(
      app,
      /const PrivateAddFundsDrawer = !PUBLIC_VIEWER_MODE[\s\S]*?import\('\.\/components\/Funding\/AddFundsDrawer'\)/s,
    )
    assert.match(
      app,
      /\{PrivateAddFundsDrawer &&[\s\S]*?hasConfirmedPlayer &&[\s\S]*?!isRestoringAuth &&[\s\S]*?!PUBLIC_VIEWER_MODE \?\s*\(\s*<Suspense fallback=\{null\}>[\s\S]*?<PrivateAddFundsDrawer \/>[\s\S]*?<\/Suspense>\s*\) : null\}/s,
    )
    assert.doesNotMatch(app, /matchMedia|innerWidth|screen\.width/)
  })

  it('renders the account header only for a confirmed player', () => {
    assert.match(
      headerGate,
      /const PrivateAppHeader = !PUBLIC_VIEWER_MODE[\s\S]*?import\('\.\/AppHeader'\)/s,
    )
    assert.match(
      headerGate,
      /if \(isLoading \|\| isPlayerVerificationLoading\)[\s\S]*?if \(PrivateAppHeader && hasConfirmedPlayer && !PUBLIC_VIEWER_MODE\)/s,
    )
  })

  it('defensively gates active and dormant betting code', () => {
    assert.match(
      bettingModel,
      /if \(!hasConfirmedPlayer\)\s*{\s*setMessage\('Please log in to place bets'\)\s*return/s,
    )
    assert.match(
      bettingModel,
      /isAuthenticated:\s*hasConfirmedPlayer/,
    )
    assert.match(
      bettingPanel,
      /if \(!hasConfirmedPlayer\)\s*{\s*return null\s*}/s,
    )
    assert.match(betStore, /getDefaultHorseIds/)
    assert.match(betStore, /Invalid horse selection/)
  })
})
