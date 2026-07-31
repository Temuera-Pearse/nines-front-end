import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NinesApiError, parseApiError } from '../src/api/apiError'
import { createNinesApiClient } from '../src/api/ninesApiClient'
import { startKycSession } from '../src/kyc/api/startKycSession'
import { getKycProfile } from '../src/kyc/api/getKycProfile'
import { KycStatusCard } from '../src/kyc/components/KycStatusCard'
import { parseKycProfile, type KycProfile } from '../src/kyc/domain/KycProfile'
import {
  KycPopupBlockedError,
  KycPopupUrlError,
  monitorKycPopup,
  reserveKycPopup,
  type KycPopupHost,
  type KycPopupWindow,
} from '../src/kyc/popup/kycPopup'
import { AccountStatusBadge } from '../src/player/components/AccountStatusBadge'
import { PermissionGateView } from '../src/player/components/PermissionGateView'
import { parseCurrentPlayer, type CurrentPlayer } from '../src/player/domain/CurrentPlayer'
import { getCurrentPlayer } from '../src/player/api/getCurrentPlayer'
import { isPermissionAllowed } from '../src/player/domain/permissionDecision'

const permissions = {
  viewRaces: true,
  usePracticeBalance: false,
  deposit: false,
  withdraw: false,
  placeWager: false,
  startKyc: true,
  manageProfile: true,
}

const player: CurrentPlayer = {
  playerId: '8f83f475-61b6-4eb5-aa26-83944fce7731',
  email: 'player@example.test',
  displayName: 'Test Player',
  accountStatus: 'restricted',
  kycStatus: 'not_started',
  permissions,
}

function renderKyc(profile: KycProfile | null, fallbackStatus?: unknown) {
  return renderToStaticMarkup(
    <KycStatusCard
      profile={profile}
      fallbackStatus={fallbackStatus}
      canStart
      isLoading={false}
      isRefreshing={false}
      isStarting={false}
      error={null}
      startError={null}
      popupStatus="idle"
      popupError={null}
      onRefresh={() => undefined}
      onStart={() => undefined}
      onResume={() => undefined}
    />,
  )
}

describe('player and KYC contract validation', () => {
  it('accepts the real current-player contract', () => {
    assert.deepEqual(parseCurrentPlayer(player), player)
  })

  it('fails closed for unknown account and KYC states', () => {
    assert.throws(() =>
      parseCurrentPlayer({ ...player, accountStatus: 'recovering' }),
    )
    assert.throws(() =>
      parseCurrentPlayer({ ...player, kycStatus: 'approved' }),
    )
    assert.throws(() =>
      parseKycProfile({
        status: 'approved',
        verifiedAt: null,
        expiresAt: null,
        currentSession: null,
      }),
    )
  })

  it('fails closed for missing or unknown permissions', () => {
    assert.throws(() =>
      parseCurrentPlayer({
        ...player,
        permissions: { ...permissions, deposit: undefined },
      }),
    )
  })

  it('rejects malformed KYC timestamps', () => {
    assert.throws(() =>
      parseKycProfile({
        status: 'pending',
        verifiedAt: null,
        expiresAt: null,
        currentSession: {
          sessionId: '2cb58993-11dd-4a60-b063-4eec84ba5386',
          status: 'pending',
          provider: 'fake',
          expiresAt: 'not-a-date',
          verificationUrl: 'https://fake.local/verify/session',
        },
      }),
    )
  })
})

describe('account and KYC status rendering', () => {
  for (const [status, label] of [
    ['active', 'Account: Active'],
    ['restricted', 'Account: Restricted'],
    ['suspended', 'Account: Suspended'],
    ['closed', 'Account: Closed'],
  ] as const) {
    it(`renders ${status} account status with text`, () => {
      const html = renderToStaticMarkup(
        <AccountStatusBadge status={status} showExplanation />,
      )
      assert.match(html, new RegExp(label))
    })
  }

  it('renders an unknown account state as unavailable', () => {
    const html = renderToStaticMarkup(
      <AccountStatusBadge status="unexpected" showExplanation />,
    )
    assert.match(html, /Account: Unavailable/)
    assert.match(html, /features remain unavailable/)
  })

  for (const [status, expected] of [
    ['not_started', 'Not started'],
    ['verified', 'Completed'],
    ['failed', 'Unsuccessful'],
    ['manual_review', 'Review required'],
    ['expired', 'Expired'],
  ] as const) {
    it(`renders ${status} KYC state`, () => {
      assert.match(renderKyc(null, status), new RegExp(expected))
    })
  }

  it('renders a pending session and safe resume link', () => {
    const html = renderKyc({
      status: 'pending',
      verifiedAt: null,
      expiresAt: null,
      currentSession: {
        sessionId: '2cb58993-11dd-4a60-b063-4eec84ba5386',
        status: 'pending',
        provider: 'fake',
        expiresAt: '2030-01-01T00:00:00.000Z',
        verificationUrl: 'https://fake.local/verify/session',
      },
    })
    assert.match(html, /In progress/)
    assert.match(html, /Resume verification/)
  })

  it('rejects unsafe verification links in the UI', () => {
    const html = renderKyc({
      status: 'pending',
      verifiedAt: null,
      expiresAt: null,
      currentSession: {
        sessionId: '2cb58993-11dd-4a60-b063-4eec84ba5386',
        status: 'pending',
        provider: 'fake',
        expiresAt: '2030-01-01T00:00:00.000Z',
        verificationUrl: 'javascript:alert(1)',
      },
    })
    assert.doesNotMatch(html, /javascript:/)
    assert.match(html, /No safe verification link/)
  })

  it('shows the fake-provider notice in development', () => {
    assert.match(
      renderKyc(null, 'not_started'),
      /Development verification only. No real identity check is performed./,
    )
  })

  it('renders unknown KYC state as unavailable and without a start action', () => {
    const html = renderKyc(null, 'unexpected')
    assert.match(html, /Status unavailable/)
    assert.doesNotMatch(html, /Verify identity/)
  })

  it('shows a clear popup-blocked state', () => {
    const html = renderToStaticMarkup(
      <KycStatusCard
        profile={null}
        fallbackStatus="not_started"
        canStart
        isLoading={false}
        isRefreshing={false}
        isStarting={false}
        error={null}
        startError={null}
        popupStatus="blocked"
        popupError={new KycPopupBlockedError()}
        onRefresh={() => undefined}
        onStart={() => undefined}
        onResume={() => undefined}
      />,
    )
    assert.match(html, /verification popup was blocked/i)
  })
})

class FakePopup implements KycPopupWindow {
  closed = false
  navigatedTo: string | null = null
  location = {
    replace: (url: string) => {
      this.navigatedTo = url
    },
  }

  close() {
    this.closed = true
  }
}

class FakePopupHost implements KycPopupHost {
  popup: FakePopup | null = new FakePopup()
  listeners = new Set<(event: MessageEvent) => void>()
  intervals = new Map<number, () => void>()
  timeouts = new Map<number, () => void>()
  nextTimer = 1
  openArguments: unknown[] | null = null

  open(url?: string | URL, target?: string, features?: string) {
    this.openArguments = [url, target, features]
    return this.popup
  }

  addEventListener(
    _type: 'message',
    listener: (event: MessageEvent) => void,
  ) {
    this.listeners.add(listener)
  }

  removeEventListener(
    _type: 'message',
    listener: (event: MessageEvent) => void,
  ) {
    this.listeners.delete(listener)
  }

  setInterval(handler: () => void) {
    const id = this.nextTimer++
    this.intervals.set(id, handler)
    return id
  }

  clearInterval(handle: number) {
    this.intervals.delete(handle)
  }

  setTimeout(handler: () => void) {
    const id = this.nextTimer++
    this.timeouts.set(id, handler)
    return id
  }

  clearTimeout(handle: number) {
    this.timeouts.delete(handle)
  }

  emit(input: {
    origin: string
    data: unknown
    source?: KycPopupWindow | null
  }) {
    const event = {
      origin: input.origin,
      data: input.data,
      source: input.source === undefined ? this.popup : input.source,
    } as unknown as MessageEvent
    for (const listener of [...this.listeners]) listener(event)
  }

  poll() {
    for (const handler of [...this.intervals.values()]) handler()
  }

  timeout() {
    for (const handler of [...this.timeouts.values()]) handler()
  }
}

describe('hosted KYC popup lifecycle', () => {
  const sessionId = '2cb58993-11dd-4a60-b063-4eec84ba5386'
  const verificationUrl = `http://localhost:3002/dev/kyc/mock/${sessionId}`

  it('reserves a correctly sized popup and reports blockers', () => {
    const host = new FakePopupHost()
    assert.equal(reserveKycPopup(host), host.popup)
    assert.deepEqual(host.openArguments?.slice(0, 2), [
      'about:blank',
      'nines-kyc-provider',
    ])
    assert.match(String(host.openArguments?.[2]), /width=520/)
    assert.match(String(host.openArguments?.[2]), /height=650/)

    host.popup = null
    assert.throws(() => reserveKycPopup(host), KycPopupBlockedError)
  })

  it('opens the returned URL and accepts only the expected completion message', async () => {
    const host = new FakePopupHost()
    const popup = reserveKycPopup(host) as FakePopup
    let resolved = false
    const result = monitorKycPopup({
      host,
      popup,
      sessionId,
      verificationUrl,
      allowInsecureDevelopmentUrl: true,
    }).then((value) => {
      resolved = true
      return value
    })
    assert.equal(popup.navigatedTo, verificationUrl)

    host.emit({
      origin: 'http://evil.example',
      data: { type: 'nines:kyc-complete', sessionId, outcome: 'pass' },
    })
    host.emit({
      origin: 'http://localhost:3002',
      data: {
        type: 'nines:kyc-complete',
        sessionId: 'wrong-session',
        outcome: 'pass',
      },
    })
    host.emit({
      origin: 'http://localhost:3002',
      data: { type: 'unrelated', sessionId, outcome: 'pass' },
    })
    host.emit({
      origin: 'http://localhost:3002',
      source: new FakePopup(),
      data: { type: 'nines:kyc-complete', sessionId, outcome: 'pass' },
    })
    await Promise.resolve()
    assert.equal(resolved, false)

    host.emit({
      origin: 'http://localhost:3002',
      data: { type: 'nines:kyc-complete', sessionId, outcome: 'pass' },
    })
    assert.deepEqual(await result, { status: 'completed', outcome: 'pass' })
    assert.equal(host.listeners.size, 0)
    assert.equal(host.intervals.size, 0)
    assert.equal(host.timeouts.size, 0)
  })

  it('handles cancellation without inventing a KYC result', async () => {
    const host = new FakePopupHost()
    const popup = reserveKycPopup(host)
    const result = monitorKycPopup({
      host,
      popup,
      sessionId,
      verificationUrl,
      allowInsecureDevelopmentUrl: true,
    })
    host.emit({
      origin: 'http://localhost:3002',
      data: { type: 'nines:kyc-cancelled', sessionId },
    })
    assert.deepEqual(await result, { status: 'cancelled' })
  })

  it('detects a popup closed manually and removes its listener', async () => {
    const host = new FakePopupHost()
    const popup = reserveKycPopup(host) as FakePopup
    const result = monitorKycPopup({
      host,
      popup,
      sessionId,
      verificationUrl,
      allowInsecureDevelopmentUrl: true,
    })
    popup.closed = true
    host.poll()
    assert.deepEqual(await result, { status: 'closed' })
    assert.equal(host.listeners.size, 0)
  })

  it('closes on timeout and aborts cleanly on unmount', async () => {
    const timeoutHost = new FakePopupHost()
    const timeoutPopup = reserveKycPopup(timeoutHost) as FakePopup
    const timedOut = monitorKycPopup({
      host: timeoutHost,
      popup: timeoutPopup,
      sessionId,
      verificationUrl,
      allowInsecureDevelopmentUrl: true,
    })
    timeoutHost.timeout()
    assert.deepEqual(await timedOut, { status: 'timeout' })
    assert.equal(timeoutPopup.closed, true)
    assert.equal(timeoutHost.listeners.size, 0)
    assert.equal(timeoutHost.intervals.size, 0)
    assert.equal(timeoutHost.timeouts.size, 0)

    const abortHost = new FakePopupHost()
    const abortPopup = reserveKycPopup(abortHost) as FakePopup
    const controller = new AbortController()
    const aborted = monitorKycPopup({
      host: abortHost,
      popup: abortPopup,
      sessionId,
      verificationUrl,
      allowInsecureDevelopmentUrl: true,
      signal: controller.signal,
    })
    controller.abort()
    await assert.rejects(aborted, { name: 'AbortError' })
    assert.equal(abortPopup.closed, true)
    assert.equal(abortHost.listeners.size, 0)
    assert.equal(abortHost.intervals.size, 0)
    assert.equal(abortHost.timeouts.size, 0)
  })

  it('rejects insecure non-development and malformed provider URLs', () => {
    const host = new FakePopupHost()
    const popup = reserveKycPopup(host)
    assert.throws(
      () =>
        monitorKycPopup({
          host,
          popup,
          sessionId,
          verificationUrl,
          allowInsecureDevelopmentUrl: false,
        }),
      KycPopupUrlError,
    )
  })
})

describe('permission decisions', () => {
  it('allows only an explicit true permission from successful player data', () => {
    assert.equal(isPermissionAllowed('success', player, 'viewRaces'), true)
  })

  it('denies explicit false, loading, error, and missing player data', () => {
    assert.equal(isPermissionAllowed('success', player, 'deposit'), false)
    assert.equal(isPermissionAllowed('loading', player, 'viewRaces'), false)
    assert.equal(isPermissionAllowed('error', player, 'viewRaces'), false)
    assert.equal(isPermissionAllowed('success', null, 'viewRaces'), false)
  })

  it('keeps a restricted verified player blocked when the API permission is false', () => {
    const restrictedVerified = {
      ...player,
      accountStatus: 'restricted' as const,
      kycStatus: 'verified' as const,
      permissions: { ...permissions, deposit: false },
    }
    assert.equal(
      isPermissionAllowed('success', restrictedVerified, 'deposit'),
      false,
    )
  })

  it('renders allowed content through the permission gate', () => {
    const html = renderToStaticMarkup(
      <PermissionGateView
        permission="viewRaces"
        player={player}
        status="success"
      >
        <button>View race</button>
      </PermissionGateView>,
    )
    assert.match(html, /View race/)
  })

  it('renders a denial fallback and fails closed while loading', () => {
    const denied = renderToStaticMarkup(
      <PermissionGateView
        permission="deposit"
        player={player}
        status="success"
        fallback={<p>Unavailable</p>}
      >
        <button>Deposit</button>
      </PermissionGateView>,
    )
    const loading = renderToStaticMarkup(
      <PermissionGateView
        permission="viewRaces"
        player={player}
        status="loading"
        loadingFallback={<p>Checking access</p>}
      >
        <button>View race</button>
      </PermissionGateView>,
    )
    assert.match(denied, /Unavailable/)
    assert.doesNotMatch(denied, /Deposit/)
    assert.match(loading, /Checking access/)
    assert.doesNotMatch(loading, /View race/)
  })

  it('disables denied content and keeps its explanation visible', () => {
    const html = renderToStaticMarkup(
      <PermissionGateView
        permission="withdraw"
        player={player}
        status="success"
        mode="disable"
        fallback={<p>Withdrawals are unavailable.</p>}
      >
        <button>Withdraw</button>
      </PermissionGateView>,
    )
    assert.match(html, /disabled/)
    assert.match(html, /aria-disabled="true"/)
    assert.match(html, /Withdrawals are unavailable/)
  })
})

describe('Nines API client', () => {
  it('loads and validates both player endpoints through mocked HTTP', async () => {
    const urls: string[] = []
    const client = createNinesApiClient({
      baseUrl: 'https://api.example.test',
      getAccessToken: async () => 'access-token',
      fetchImpl: async (url) => {
        urls.push(String(url))
        const payload = String(url).endsWith('/kyc')
          ? {
              status: 'not_started',
              verifiedAt: null,
              expiresAt: null,
              currentSession: null,
            }
          : player
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      },
    })

    const [loadedPlayer, loadedKyc] = await Promise.all([
      getCurrentPlayer(client),
      getKycProfile(client),
    ])
    assert.equal(loadedPlayer.playerId, player.playerId)
    assert.equal(loadedKyc.status, 'not_started')
    assert.deepEqual(urls.sort(), [
      'https://api.example.test/v1/me',
      'https://api.example.test/v1/me/kyc',
    ])
  })

  it('attaches an Auth0 access token and captures response correlation', async () => {
    let request: RequestInit | undefined
    const client = createNinesApiClient({
      baseUrl: 'https://api.example.test/',
      getAccessToken: async () => 'access-token',
      fetchImpl: async (_url, init) => {
        request = init
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': 'corr-success',
          },
        })
      },
    })

    const response = await client.request<{ ok: boolean }>('/v1/me')
    const headers = new Headers(request?.headers)
    assert.equal(headers.get('authorization'), 'Bearer access-token')
    assert.ok(headers.get('x-correlation-id'))
    assert.equal(response.correlationId, 'corr-success')
  })

  it('preserves the response correlation ID for a malformed success payload', async () => {
    const client = createNinesApiClient({
      baseUrl: 'https://api.example.test',
      getAccessToken: async () => 'access-token',
      fetchImpl: async () =>
        new Response(JSON.stringify({ playerId: 'incomplete' }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': 'corr-invalid-player',
          },
        }),
    })

    await assert.rejects(
      getCurrentPlayer(client),
      (error: unknown) =>
        error instanceof NinesApiError &&
        error.code === 'INVALID_RESPONSE' &&
        error.correlationId === 'corr-invalid-player',
    )
  })

  it('fails closed for an unknown KYC session status', async () => {
    const client = createNinesApiClient({
      baseUrl: 'https://api.example.test',
      getAccessToken: async () => 'access-token',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            sessionId: '7accab90-da4b-41c9-b0b4-c5c88878ccbd',
            status: 'approved',
            provider: 'fake',
            expiresAt: '2030-01-01T00:00:00.000Z',
            verificationUrl: 'https://fake.local/verify/session',
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
              'x-correlation-id': 'corr-invalid-session',
            },
          },
        ),
    })

    await assert.rejects(
      startKycSession(client, 'stable-action-key'),
      (error: unknown) =>
        error instanceof NinesApiError &&
        error.code === 'INVALID_RESPONSE' &&
        error.correlationId === 'corr-invalid-session',
    )
  })

  it('parses safe errors and prefers envelope correlation IDs', () => {
    const error = parseApiError(
      403,
      {
        error: {
          code: 'KYC_OPERATION_NOT_ALLOWED',
          message: 'KYC verification cannot be started',
          correlationId: 'corr-envelope',
          reasonCodes: ['ACCOUNT_RESTRICTED'],
        },
      },
      'corr-header',
    )
    assert.equal(error.category, 'eligibility')
    assert.equal(error.correlationId, 'corr-envelope')
    assert.deepEqual(error.reasonCodes, ['ACCOUNT_RESTRICTED'])
  })

  it('uses the response header correlation ID for malformed error bodies', () => {
    const error = parseApiError(503, null, 'corr-header')
    assert.equal(error.category, 'dependency')
    assert.equal(error.correlationId, 'corr-header')
    assert.equal(error.code, 'HTTP_503')
  })

  it('returns an authentication error without calling fetch when no token exists', async () => {
    let called = false
    const client = createNinesApiClient({
      baseUrl: 'https://api.example.test',
      getAccessToken: async () => null,
      fetchImpl: async () => {
        called = true
        return new Response()
      },
    })
    await assert.rejects(
      client.request('/v1/me'),
      (error: unknown) =>
        error instanceof NinesApiError &&
        error.category === 'authentication',
    )
    assert.equal(called, false)
  })

  it('reuses the supplied KYC idempotency key across a retry', async () => {
    const keys: Array<string | null> = []
    let attempt = 0
    const client = createNinesApiClient({
      baseUrl: 'https://api.example.test',
      getAccessToken: async () => 'token',
      fetchImpl: async (_url, init) => {
        keys.push(new Headers(init?.headers).get('idempotency-key'))
        attempt += 1
        if (attempt === 1) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'KYC_SESSION_CREATION_FAILED',
                message: 'Temporarily unavailable',
                correlationId: 'corr-first',
              },
            }),
            {
              status: 503,
              headers: { 'content-type': 'application/json' },
            },
          )
        }
        return new Response(
          JSON.stringify({
            sessionId: '7accab90-da4b-41c9-b0b4-c5c88878ccbd',
            status: 'pending',
            provider: 'fake',
            expiresAt: '2030-01-01T00:00:00.000Z',
            verificationUrl: 'https://fake.local/verify/session',
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        )
      },
    })

    await assert.rejects(startKycSession(client, 'stable-action-key'))
    await startKycSession(client, 'stable-action-key')
    assert.deepEqual(keys, ['stable-action-key', 'stable-action-key'])
  })
})
