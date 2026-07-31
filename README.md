# Nines frontend

The Nines frontend is a Vite 5, React 18 and TypeScript race viewer. It can run
as a public race-only viewer or as an Auth0-enabled player application with
account and fake-KYC presentation from `nines-api`.

## Local development

Use Node and npm versions compatible with the checked-in lockfile, then:

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and configure only browser-safe values.
Every `VITE_*` value is public. Never put Auth0 client secrets, provider
secrets, webhook secrets, API tokens intended to remain private, or other
credentials in frontend environment variables.

The development server proxies `/v1` to `NINES_API_PROXY_TARGET`. This allows
`VITE_NINES_API_URL=/` for same-origin local calls. A deployed frontend may
instead use the HTTPS origin of `nines-api`, provided that API CORS is
configured for the frontend origin.

For the hosted mock KYC flow, run `nines-api` at
`http://localhost:3002` with:

```env
NODE_ENV=development
ENABLE_FAKE_KYC_TEST_ROUTES=true
PUBLIC_API_BASE_URL=http://localhost:3002
CORS_ORIGIN=http://localhost:5173
```

Run this frontend with public viewer mode off, Auth0 and KYC enabled, and
`VITE_NINES_API_URL=/`. Configure the Auth0 SPA values and set
`NINES_API_PROXY_TARGET=http://127.0.0.1:3002`.

## Runtime configuration

| Variable | Purpose |
| --- | --- |
| `VITE_PUBLIC_VIEWER_MODE` | Enables race-only viewing and prevents Auth0 and protected player requests. |
| `VITE_AUTH_ENABLED` | Enables the existing Auth0 SPA integration. Requires public viewer mode to be off. |
| `VITE_KYC_UI_ENABLED` | Independently enables account KYC loading and fake-session actions. |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain. |
| `VITE_AUTH0_CLIENT_ID` | Public Auth0 SPA client ID. |
| `VITE_AUTH0_AUDIENCE` | Audience for the `nines-api` access token. |
| `VITE_NINES_API_URL` | `nines-api` base URL or same-origin base path. |
| `VITE_NINES_BACKEND_URL` | Race service HTTP base URL. |
| `VITE_NINES_WS_URL` | Race service WebSocket URL. |

Authenticated mode fails clearly at startup when its Auth0 or API
configuration is incomplete, and invalid boolean flags are rejected. The
player integration values are parsed once in the typed
`src/config/playerIntegration.ts` module rather than read in components.
Auth0 is intentionally configured with its
existing local-storage cache policy; no additional token storage was added.
Tokens are requested through the Auth0 SDK with the configured audience and
`openid profile email` scopes.

## Player and KYC flow

After Auth0 restores an authenticated human session, the player data provider
requests:

```text
GET /v1/me
GET /v1/me/kyc
```

`/v1/me` is the source of player identity, account state, KYC summary and
permissions. Responses are runtime-validated. Missing fields and unknown
account, KYC or permission values fail closed. Public viewers and users with
Auth0 disabled never call either protected endpoint.

The account drawer shows the explicit API account status and the full safe KYC
profile. A permitted start or retry action calls:

```text
POST /v1/me/kyc/sessions
```

One idempotency key is generated for the user action and retained while that
same action is retried. Duplicate submissions are blocked. A successful call
means only that a session was started or resumed; it does not mean identity
verification succeeded. The returned development URL opens in a 520×650
external-style popup. Pass or Fail is submitted by that page to `nines-api`,
which applies the existing provider-event pathway. The popup sends only a
narrow completion/cancellation message—never a token—to its opener.

The frontend validates the popup origin, message type, session UUID, outcome,
and source window. Completion refreshes both player and KYC resources.
Cancellation makes no state change. Popup blockers, manual closure, timeout,
provider errors and listener cleanup have explicit handling. Account refreshes
remain cancelled and deduplicated without interrupting race playback.

The fake KYC provider performs no real identity verification.

Pass and Fail controls exist only inside the development hosted-provider page,
never in the normal account UI or a production build. Manual-review and expiry
outcomes remain driven through backend test facilities or fixtures.

## Permission and authority model

Frontend permissions are display controls only.

Backend services remain responsible for authorization.

The frontend never derives an operation permission from KYC status. UI gates
read only the permission booleans returned by `/v1/me`, default unknown data to
denied, and present currently deferred features as unavailable. The frontend
does not submit deposits, withdrawals or wagers and does not present a player
balance. Future backend operations must enforce eligibility independently.

Authority remains split as follows:

- Auth0 authenticates the human.
- `nines-api` owns player identity, account state, KYC and eligibility.
- `nines-front-end` presents API state and grants no authority.
- `nines-financial` remains the future authority for money.
- `nines-back-end` remains the authority for races.

## Responsive account access

Desktop players open Account and verification from the existing avatar menu.
In authenticated mobile deployments, a compact bottom bar provides Race,
disabled Selection, and Account destinations. The complete account workflow
opens in a focus-managed sheet/drawer, leaving the top header and race viewport
unchanged. Public race viewing never redirects to login.

## Errors and correlation

The API client distinguishes authentication, eligibility, validation,
conflict, dependency and unexpected failures. Safe API messages are mapped to
controlled player-facing copy. Each request sends a fresh browser-safe
correlation ID. Correlation IDs from the API error envelope or
`X-Correlation-Id` response header are retained even when a successful
response fails runtime validation, and are shown as support references. Raw
responses, tokens, stack traces and provider internals are not displayed or
logged.

## Validation

```sh
npm run typecheck
npm test
npm run build
npm audit --omit=dev
git diff --check
```

The Node test suite uses `tsx`, React server rendering and mocked `fetch`
boundaries. It does not call Auth0 or a live API. This repository currently has
no lint or browser E2E script.

## Deferred work

This phase does not include a real KYC provider or redirect flow, document or
biometric capture, operator/manual-review tools, deposits, withdrawals,
balances, wallets, crypto, wagering, jurisdiction/geolocation, responsible
gambling, notifications, email or SMS. Those require later backend-authorized
phases.
