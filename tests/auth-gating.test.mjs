import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url).pathname
const read = (path) => readFileSync(join(root, path), 'utf8')

describe('Auth0 and player integration boundary', () => {
  const main = read('src/main.tsx')
  const app = read('src/App.tsx')
  const authProvider = read('src/auth/AppAuthProvider.tsx')
  const auth0Provider = read('src/auth/Auth0AppAuthProvider.tsx')
  const authConfig = read('src/auth/config.ts')
  const playerProvider = read('src/player/PlayerAccountProvider.tsx')
  const client = read('src/api/ninesApiClient.ts')
  const features = read('src/config/features.ts')
  const playerIntegration = read('src/config/playerIntegration.ts')
  const popup = read('src/kyc/popup/kycPopup.ts')
  const envExample = read('.env.example')

  it('keeps Auth0 lazy and disabled in public viewer mode', () => {
    assert.match(authProvider, /const EnabledAppAuthProvider = AUTH0_CONFIG\.isEnabled/)
    assert.match(authProvider, /if \(!EnabledAppAuthProvider \|\| !AUTH0_CONFIG\.isEnabled\)/)
    assert.match(
      playerIntegration,
      /!publicViewerMode && \(authEnabledFlag \?\? !isProduction\)/,
    )
    assert.match(envExample, /^VITE_PUBLIC_VIEWER_MODE=true$/m)
    assert.match(envExample, /^VITE_AUTH_ENABLED=false$/m)
  })

  it('uses Auth0 only for authentication and access-token retrieval', () => {
    assert.match(auth0Provider, /getAccessTokenSilently/)
    assert.match(auth0Provider, /audience: AUTH0_CONFIG\.audience/)
    assert.match(auth0Provider, /scope: 'openid profile email'/)
    assert.doesNotMatch(auth0Provider, /\/auth\/me/)
    assert.doesNotMatch(auth0Provider, /roles\.includes/)
    assert.match(authProvider, /getAccessToken: \(\) => Promise<string \| null>/)
  })

  it('fails clearly when authenticated runtime configuration is incomplete', () => {
    assert.match(authConfig, /assertPlayerIntegrationConfiguration\(\)/)
    assert.match(
      playerIntegration,
      /export function assertPlayerIntegrationConfiguration/,
    )
    for (const key of [
      'VITE_AUTH0_DOMAIN',
      'VITE_AUTH0_CLIENT_ID',
      'VITE_AUTH0_AUDIENCE',
      'VITE_NINES_API_URL',
    ]) {
      assert.match(playerIntegration, new RegExp(key))
    }
  })

  it('calls protected endpoints only for an authenticated non-public viewer', () => {
    assert.match(
      playerProvider,
      /const mayLoadProtectedData =\s*isEnabled &&\s*!PUBLIC_VIEWER_MODE &&\s*!isAuthLoading &&\s*auth0SessionIsAuthenticated/s,
    )
    assert.match(playerProvider, /if \(mayLoadProtectedData\) \{\s*void refreshAll\(\)/s)
    assert.match(read('src/player/api/getCurrentPlayer.ts'), /'\/v1\/me'/)
    assert.match(read('src/kyc/api/getKycProfile.ts'), /'\/v1\/me\/kyc'/)
    assert.match(
      read('src/kyc/api/startKycSession.ts'),
      /'\/v1\/me\/kyc\/sessions'/,
    )
  })

  it('attaches bearer and idempotency headers without logging tokens', () => {
    assert.match(client, /Authorization: `Bearer \$\{accessToken\}`/)
    assert.match(client, /headers\.set\('Idempotency-Key', options\.idempotencyKey\)/)
    assert.doesNotMatch(client, /console\./)
  })

  it('deduplicates, cancels, and refreshes both resources after KYC start', () => {
    assert.match(playerProvider, /if \(playerRequestRef\.current\) return playerRequestRef\.current/)
    assert.match(playerProvider, /if \(kycRequestRef\.current\) return kycRequestRef\.current/)
    assert.match(playerProvider, /playerAbortRef\.current\?\.abort\(\)/)
    assert.match(playerProvider, /kycAbortRef\.current\?\.abort\(\)/)
    assert.match(playerProvider, /idempotencyKeyRef\.current \?\?/)
    assert.match(playerProvider, /await refreshAll\(\)/)
    assert.match(playerProvider, /idempotencyKeyRef\.current = null/)
    assert.match(playerProvider, /reservePopup\(\)/)
    assert.match(playerProvider, /monitorReservedPopup\(session, popup\)/)
    assert.match(
      playerProvider,
      /if \(result\.status === 'completed'\)[\s\S]*?await refreshAll\(\)/,
    )
    assert.match(popup, /event\.origin !== targetUrl\.origin/)
    assert.match(popup, /event\.source !== input\.popup/)
    assert.match(popup, /message\.sessionId === sessionId/)
    assert.match(popup, /removeEventListener\('message', onMessage\)/)
  })

  it('does not pause or crash the race viewer for account loading', () => {
    assert.match(main, /<PlayerAccountProvider>/)
    assert.match(main, /<AppErrorBoundary>/)
    assert.match(app, /<MobileLayout \{\.\.\.layoutProps\} \/>/)
    assert.match(app, /<DesktopLayout \{\.\.\.layoutProps\} \/>/)
    assert.doesNotMatch(app, /Restoring your session/)
  })
})

describe('responsive account surfaces and deferred operations', () => {
  const app = read('src/App.tsx')
  const appHeader = read('src/components/Header/AppHeader.tsx')
  const accountDropdown = read('src/components/Header/AccountDropdown.tsx')
  const publicHeader = read('src/components/Header/PublicHeader.tsx')
  const desktopLayout = read('src/layouts/desktop/DesktopLayout.tsx')
  const mobileLayout = read('src/layouts/mobile/MobileLayout.tsx')
  const mobileNav = read('src/layouts/mobile/MobileBottomNav.tsx')
  const drawer = read('src/player/components/AccountDrawer.tsx')

  it('offers login without redirecting an unauthenticated race viewer', () => {
    assert.match(publicHeader, /\{isEnabled \? \(/)
    assert.match(publicHeader, /Sign in/)
    assert.doesNotMatch(publicHeader, /window\.location\.assign/)
  })

  it('uses the existing desktop dropdown to open the account drawer', () => {
    assert.match(accountDropdown, /Account and verification/)
    assert.match(appHeader, /window\.location\.hash = '#account'/)
    assert.match(app, /<AccountDrawer \/>/)
  })

  it('provides compact mobile Race, Selection, and Account navigation', () => {
    assert.match(mobileLayout, /<MobileBottomNav \/>/)
    assert.match(mobileNav, />\s*Race\s*</)
    assert.match(mobileNav, /Selection/)
    assert.match(mobileNav, /Unavailable/)
    assert.match(mobileNav, /Account/)
  })

  it('manages drawer focus and keyboard dismissal', () => {
    assert.match(drawer, /role="dialog"/)
    assert.match(drawer, /aria-modal="true"/)
    assert.match(drawer, /event\.key === 'Escape'/)
    assert.match(drawer, /event\.key !== 'Tab'/)
    assert.match(drawer, /previousFocusRef\.current\?\.focus\(\)/)
  })

  it('keeps fake money and wager actions out of reachable layouts', () => {
    assert.doesNotMatch(app, /AddFundsDrawer/)
    assert.doesNotMatch(appHeader, /useFundingStore|Add Funds|balanceUsdc/)
    assert.doesNotMatch(desktopLayout, /BettingArea/)
    assert.doesNotMatch(mobileLayout, /MobileSelectionSheet/)
  })
})
