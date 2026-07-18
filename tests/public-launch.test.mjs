import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url).pathname
const read = (path) => readFileSync(join(root, path), 'utf8')
const sourceFiles = (directory) =>
  readdirSync(join(root, directory)).flatMap((entry) => {
    const relative = join(directory, entry)
    return statSync(join(root, relative)).isDirectory()
      ? sourceFiles(relative)
      : [relative]
  })

describe('public launch guardrails', () => {
  const app = read('src/App.tsx')
  const authProvider = read('src/auth/AppAuthProvider.tsx')
  const auth0Provider = read('src/auth/Auth0AppAuthProvider.tsx')
  const disabledRoutes = read('src/config/disabledRoutes.ts')
  const errorBoundary = read('src/components/ErrorBoundary/AppErrorBoundary.tsx')
  const headerTiming = read('src/state/useRaceHeaderTiming.ts')
  const publicHeader = read('src/components/Header/PublicHeader.tsx')
  const desktopLayout = read('src/layouts/desktop/DesktopLayout.tsx')
  const mobileLayout = read('src/layouts/mobile/MobileLayout.tsx')
  const liveRaceLeaderboard = read(
    'src/components/LiveRaceLeaderboard/LiveRaceLeaderboard.tsx',
  )
  const resultsPanel = read('src/components/ResultsPanel/ResultsPanel.tsx')
  const runtime = read('src/config/runtime.ts')
  const websocket = read('src/ws/websocket.ts')
  const viteConfig = read('vite.config.ts')
  const headers = read('public/_headers')
  const redirects = read('public/_redirects')
  const index = read('index.html')
  const manifest = read('public/site.webmanifest')

  it('renders the race viewer while auth is disabled', () => {
    assert.match(authProvider, /if \(!EnabledAppAuthProvider \|\| !AUTH0_CONFIG\.isEnabled\)/)
    assert.match(authProvider, /<AppAuthContext\.Provider value=\{defaultContextValue\}>/)
    assert.match(app, /<HeaderGate \/>/)
    assert.match(app, /<MobileLayout \{\.\.\.layoutProps\} \/>/)
    assert.match(app, /<DesktopLayout \{\.\.\.layoutProps\} \/>/)
  })

  it('does not initialise Auth0 or request auth identity when auth is disabled', () => {
    assert.match(authProvider, /if \(!EnabledAppAuthProvider \|\| !AUTH0_CONFIG\.isEnabled\)[\s\S]*?return \(/)
    assert.match(
      auth0Provider,
      /<Auth0Provider[\s\S]*?<AuthStateBridge>\{children\}<\/AuthStateBridge>/,
    )
    assert.match(auth0Provider, /fetch\(`\$\{baseUrl\}\/auth\/me`/)
    assert.doesNotMatch(authProvider, /@auth0\/auth0-react/)
  })

  it('blocks disabled routes including callback before rendering', () => {
    assert.match(disabledRoutes, /'\/callback'/)
    assert.match(disabledRoutes, /'\/wallet'/)
    assert.match(disabledRoutes, /isDisabledFrontendRoute/)
    assert.match(disabledRoutes, /replaceState\(\{\}, document\.title, '\/'\)/)
    assert.match(redirects, /^\/\* \/index\.html 200$/m)
  })

  it('keeps mobile and desktop auth controls absent from public surfaces', () => {
    assert.doesNotMatch(publicHeader, />\s*Login\s*</)
    assert.doesNotMatch(publicHeader, />\s*Register\s*</)
    assert.doesNotMatch(desktopLayout, /onLogin=\{/)
    assert.doesNotMatch(mobileLayout, /onLogin=\{/)
  })

  it('uses neutral public race wording in rendered guest surfaces', () => {
    const publicSources = [
      publicHeader,
      liveRaceLeaderboard,
      resultsPanel,
      index,
      manifest,
    ].join('\n')

    for (const term of [
      'bet',
      'betting',
      'bets',
      'wager',
      'gambling',
      'deposit',
      'withdraw',
      'payout',
      'odds',
      'wallet',
      'stake',
      'cash',
      'money',
      'financial',
      'coming soon',
    ]) {
      assert.doesNotMatch(publicSources, new RegExp(term, 'i'))
    }
    assert.doesNotMatch(headerTiming, /'Bets open'|'Bets closed'|'Settling bets'|'BETS OPEN'|'BETS CLOSED'|'SETTLING BETS'|'BETS OPEN IN'/)
  })

  it('redacts raw production errors while preserving development details', () => {
    assert.match(errorBoundary, /IS_DEVELOPMENT/)
    assert.match(errorBoundary, /this\.state\.error\.message/)
    assert.match(errorBoundary, /Please reload the live race viewer/)
  })

  it('prevents production localhost and plain websocket configuration', () => {
    assert.match(viteConfig, /assertProductionBuildConfig/)
    assert.match(viteConfig, /must not use a local development host in production/)
    assert.match(viteConfig, /must use \$\{protocol\.toUpperCase\(\)\} in production/)
    assert.match(runtime, /assertProductionHttpUrl/)
    assert.match(runtime, /assertProductionWsUrl/)
  })

  it('hardens websocket reconnects and malformed messages', () => {
    assert.doesNotMatch(websocket, /constructor\(\)[\s\S]*this\.connect\(\)/)
    assert.match(websocket, /JSON\.parse\(event\.data\)/)
    assert.match(websocket, /Unexpected message shape; ignoring/)
    assert.match(websocket, /Missing message type; ignoring/)
    assert.match(websocket, /Math\.random\(\) \* Math\.min\(1000, baseDelayMs \* 0\.25\)/)
    assert.match(websocket, /this\.reconnectTimeout = null/)
    assert.match(websocket, /this\.shouldReconnect = false/)
  })

  it('uses only the public race reference in production frontend code', () => {
    const productionSource = sourceFiles('src')
      .map((path) => read(path))
      .join('\n')

    assert.doesNotMatch(productionSource, /raceId|RaceId/)
    assert.match(websocket, /type: 'sync:request',[\s\S]*?raceRef/)
    assert.match(read('src/utils/raceRef.ts'), /race: \"\$\{raceRef\}\"/)
  })

  it('ships Cloudflare Pages security headers for the public viewer', () => {
    assert.match(headers, /Strict-Transport-Security: max-age=31536000; includeSubDomains/)
    assert.match(headers, /X-Content-Type-Options: nosniff/)
    assert.match(headers, /Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\)/)
    assert.match(headers, /Cross-Origin-Opener-Policy: same-origin/)
    assert.match(headers, /Content-Security-Policy-Report-Only:/)
    assert.match(headers, /object-src 'none'/)
    assert.match(headers, /frame-ancestors 'none'/)
  })
})
