# Nines Frontend Public Launch

Production URL: `https://nines.live`

## Launch Mode

The public launch build is a live race viewer.

Required public feature flags:

```env
VITE_PUBLIC_VIEWER_MODE=true
VITE_AUTH_ENABLED=false
```

All `VITE_*` values are browser-visible public configuration. Do not place
secrets, service tokens, signing keys, database credentials, or private API keys
in frontend environment variables.

## Required Endpoints

Set production endpoints in Cloudflare Pages:

```env
VITE_NINES_BACKEND_URL=https://<production-race-api-host>
VITE_NINES_WS_URL=wss://<production-race-api-host>/ws
```

The production build rejects local development hosts and rejects plain HTTP/WS
for these browser-facing endpoints. If `VITE_NINES_WS_URL` is omitted, the build
requires a valid HTTPS API URL so the client can derive a WSS origin.

## Authentication Disabled Behavior

When public viewer mode is enabled or frontend auth is disabled:

- Auth0 is not initialised.
- Auth0 callbacks are not processed.
- Silent authentication is not attempted.
- Tokens are not requested.
- `/auth/me` is not requested.
- Login and registration controls are not rendered.
- Private/account-looking routes are rewritten to `/`.

The existing Auth0 implementation remains in place for a later private build.
To reactivate it, set `VITE_PUBLIC_VIEWER_MODE=false`, set
`VITE_AUTH_ENABLED=true`, and provide the Auth0 public SPA values.

## Cloudflare Pages Files

The `public/` directory includes:

- `_headers` with HSTS, nosniff, referrer policy, permissions policy, COOP, and
  a CSP report-only policy.
- `_redirects` to serve the SPA shell for direct navigation.
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`

The CSP is report-only for launch because the current app uses inline React
style attributes and a small inline style tag. It should be enforced after those
inline styles are moved to CSS classes or covered by a nonce/hash strategy.

## Local Development

Install dependencies:

```sh
npm install
```

Run the HTTPS LAN dev server:

```sh
npm run dev -- --host
```

Local certificates are stored under `.certs/`, which is ignored by Git.

## Production Build

Run:

```sh
npm run typecheck
npm test
npm run build
```

The build output is `dist/`.

## Deployment Smoke Tests

After deploying to Cloudflare Pages:

- Open `https://nines.live/` on desktop and mobile.
- Confirm live race data loads and the race viewer renders.
- Confirm there are no login or registration controls.
- Open `/callback`, `/login`, `/register`, `/wallet`, `/bets`, and `/admin`
  directly and confirm they return to the public race viewer.
- Confirm the WebSocket connects over WSS.
- Confirm browser console errors do not blank the app.
- Confirm response headers include the entries from `public/_headers`.

## Known Limitations

- Cloudflare dashboard settings, DNS, and the production backend hostname must
  still be configured outside this repository.
- The CSP is report-only until inline styles are removed or covered safely.
- Frontend route blocking is not backend authorization.
- `.env.local` is a local development file and must not be committed.

## Rollback

Revert the frontend deployment to the previous Cloudflare Pages build. If the
new environment variables were added for launch, leave them disabled or remove
them from the active deployment configuration before redeploying.
