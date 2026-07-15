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
  const authProvider = read('src/auth/AppAuthProvider.tsx')
  const authConfig = read('src/auth/config.ts')
  const localEnv = read('.env.local')
  const publicHeader = read('src/components/Header/PublicHeader.tsx')

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
      /const hasConfirmedPlayer\s*=\s*auth0SessionIsAuthenticated\s*&&\s*playerVerification\.status === 'confirmed'\s*&&\s*player !== null\s*&&\s*player\.roles\.includes\('player'\)/s,
    )
    assert.match(
      authProvider,
      /const isPlayerVerificationLoading\s*=\s*auth0SessionIsAuthenticated\s*&&\s*\(playerVerification\.status === 'idle'\s*\|\|\s*playerVerification\.status === 'loading'\)/s,
    )
    assert.match(
      authProvider,
      /isAuthenticated:\s*hasConfirmedPlayer/,
    )
    assert.match(
      authProvider,
      /Nines API auth check returned an invalid player identity/,
    )
  })

  it('requires and requests the custom Nines API audience', () => {
    assert.match(
      localEnv,
      /^VITE_AUTH0_AUDIENCE=https:\/\/nines-api\.local$/m,
    )
    assert.match(
      authConfig,
      /audience\.length > 0[\s\S]*ninesApiUrl\.length > 0/s,
    )
    assert.match(
      authProvider,
      /getAccessTokenSilently\(\{\s*authorizationParams: \{\s*audience: AUTH0_CONFIG\.audience/s,
    )
  })

  it('uses the Vite proxy for race REST and the direct deployed WebSocket', () => {
    assert.match(
      localEnv,
      /^VITE_DEV_PROXY_TARGET=https:\/\/king-prawn-app-a39mi\.ondigitalocean\.app$/m,
    )
    assert.match(localEnv, /^VITE_NINES_BACKEND_URL=$/m)
    assert.match(
      localEnv,
      /^VITE_NINES_WS_URL=wss:\/\/king-prawn-app-a39mi\.ondigitalocean\.app$/m,
    )
  })

  it('shows Auth0 and player verification failures instead of silently reloading', () => {
    assert.match(authProvider, /authFlowError:\s*string \| null/)
    assert.match(authProvider, /const authFlowError = error\?\.message \?\? null/)
    assert.match(
      publicHeader,
      /Login unavailable: \{visibleAuthError\}/,
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
      /<div className="nines-race-track-panel">\s*<RaceTrack[\s\S]*?<\/div>[\s\S]*?<div className="nines-race-betting">\s*<BettingArea \/>/s,
    )
    assert.match(desktopLayout, /<ResultsPanel/)
    assert.match(desktopLayout, /<OnTrackEventsCard \/>/)
    assert.match(desktopLayout, /<BottomWidgets \/>/)
    assert.match(mobileLayout, /<RaceTrack/)
    assert.match(mobileSelectionSheet, /useBettingAreaModel\(\)/)
  })

  it('gates private app components independently of viewport size', () => {
    assert.match(
      desktopLayout,
      /<div className="nines-race-mobile-status">\s*<CompactRaceInfo \/>[\s\S]*?<\/div>/s,
    )
    assert.doesNotMatch(
      desktopLayout,
      /\{hasConfirmedPlayer \?\s*\(\s*<div className="nines-race-mobile-status">/s,
    )
    assert.match(
      app,
      /\{hasConfirmedPlayer && !isRestoringAuth \? <AddFundsDrawer \/> : null\}/,
    )
    assert.doesNotMatch(app, /matchMedia|innerWidth|screen\.width/)
  })

  it('renders the account header only for a confirmed player', () => {
    assert.match(
      headerGate,
      /if \(isLoading \|\| isPlayerVerificationLoading\)[\s\S]*?if \(hasConfirmedPlayer\)\s*{\s*return <AppHeader \/>/s,
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
