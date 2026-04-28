export interface Auth0RuntimeConfig {
  domain: string
  clientId: string
  cacheLocation: 'memory' | 'localstorage'
  isEnabled: boolean
}

const domain = (import.meta.env.VITE_AUTH0_DOMAIN ?? '').trim()
const clientId = (import.meta.env.VITE_AUTH0_CLIENT_ID ?? '').trim()

export const AUTH0_CONFIG: Auth0RuntimeConfig = {
  domain,
  clientId,
  cacheLocation: 'localstorage',
  isEnabled: domain.length > 0 && clientId.length > 0,
}
