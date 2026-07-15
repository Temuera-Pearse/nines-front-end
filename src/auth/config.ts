export interface Auth0RuntimeConfig {
  domain: string
  clientId: string
  audience: string
  ninesApiUrl: string
  cacheLocation: 'memory' | 'localstorage'
  isEnabled: boolean
}

const domain = (import.meta.env.VITE_AUTH0_DOMAIN ?? '').trim()
const clientId = (import.meta.env.VITE_AUTH0_CLIENT_ID ?? '').trim()
const audience = (import.meta.env.VITE_AUTH0_AUDIENCE ?? '').trim()
const ninesApiUrl = (import.meta.env.VITE_NINES_API_URL ?? '').trim()

export const AUTH0_CONFIG: Auth0RuntimeConfig = {
  domain,
  clientId,
  audience,
  ninesApiUrl,
  cacheLocation: 'localstorage',
  isEnabled:
    domain.length > 0 &&
    clientId.length > 0 &&
    audience.length > 0 &&
    ninesApiUrl.length > 0,
}
