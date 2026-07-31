export interface PlayerIntegrationRuntimeConfig {
  isProduction: boolean
  isDevelopment: boolean
  publicViewerMode: boolean
  authEnabled: boolean
  kycUiEnabled: boolean
  auth0Domain: string
  auth0ClientId: string
  auth0Audience: string
  ninesApiUrl: string
}

function readStringEnv(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readBooleanEnv(name: string, value: unknown): boolean | null {
  const raw = readStringEnv(value).toLowerCase()
  if (!raw) return null
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true
  if (['0', 'false', 'no', 'off'].includes(raw)) return false
  throw new Error(`${name} must be a boolean value`)
}

const viteEnv = import.meta.env ?? {}
const isProduction = viteEnv.PROD ?? false
const isDevelopment = viteEnv.DEV ?? !isProduction
const publicViewerFlag = readBooleanEnv(
  'VITE_PUBLIC_VIEWER_MODE',
  viteEnv.VITE_PUBLIC_VIEWER_MODE,
)
const authEnabledFlag = readBooleanEnv(
  'VITE_AUTH_ENABLED',
  viteEnv.VITE_AUTH_ENABLED,
)
const kycUiEnabledFlag = readBooleanEnv(
  'VITE_KYC_UI_ENABLED',
  viteEnv.VITE_KYC_UI_ENABLED,
)
const publicViewerMode =
  typeof __NINES_PUBLIC_VIEWER_MODE__ === 'boolean'
    ? __NINES_PUBLIC_VIEWER_MODE__
    : publicViewerFlag ?? isProduction
const authEnabled =
  typeof __NINES_AUTH_ENABLED__ === 'boolean'
    ? __NINES_AUTH_ENABLED__
    : !publicViewerMode && (authEnabledFlag ?? !isProduction)

if (publicViewerMode && authEnabledFlag === true) {
  throw new Error(
    'VITE_AUTH_ENABLED cannot be true while VITE_PUBLIC_VIEWER_MODE is true',
  )
}

export const PLAYER_INTEGRATION_CONFIG: PlayerIntegrationRuntimeConfig = {
  isProduction,
  isDevelopment,
  publicViewerMode,
  authEnabled,
  kycUiEnabled: authEnabled && (kycUiEnabledFlag ?? !isProduction),
  auth0Domain: readStringEnv(viteEnv.VITE_AUTH0_DOMAIN),
  auth0ClientId: readStringEnv(viteEnv.VITE_AUTH0_CLIENT_ID),
  auth0Audience: readStringEnv(viteEnv.VITE_AUTH0_AUDIENCE),
  ninesApiUrl: readStringEnv(viteEnv.VITE_NINES_API_URL),
}

export function assertPlayerIntegrationConfiguration(
  config: PlayerIntegrationRuntimeConfig = PLAYER_INTEGRATION_CONFIG,
): void {
  if (!config.authEnabled) return

  const missing = [
    !config.auth0Domain && 'VITE_AUTH0_DOMAIN',
    !config.auth0ClientId && 'VITE_AUTH0_CLIENT_ID',
    !config.auth0Audience && 'VITE_AUTH0_AUDIENCE',
    !config.ninesApiUrl && 'VITE_NINES_API_URL',
  ].filter((name): name is string => Boolean(name))

  if (missing.length > 0) {
    throw new Error(
      `Authenticated frontend mode is missing required configuration: ${missing.join(', ')}`,
    )
  }
}
