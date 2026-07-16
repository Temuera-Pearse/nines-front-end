function readStringEnv(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parseBooleanEnv(value: unknown): boolean | null {
  const raw = readStringEnv(value).toLowerCase()
  if (!raw) return null
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true
  if (['0', 'false', 'no', 'off'].includes(raw)) return false
  return null
}

const publicViewerFlag = parseBooleanEnv(import.meta.env.VITE_PUBLIC_VIEWER_MODE)
const authEnabledFlag = parseBooleanEnv(import.meta.env.VITE_AUTH_ENABLED)

export const IS_PRODUCTION = import.meta.env.PROD
export const IS_DEVELOPMENT = import.meta.env.DEV

export const PUBLIC_VIEWER_MODE =
  typeof __NINES_PUBLIC_VIEWER_MODE__ === 'boolean'
    ? __NINES_PUBLIC_VIEWER_MODE__
    : publicViewerFlag ?? (IS_PRODUCTION ? true : false)

export const FRONTEND_AUTH_ENABLED =
  typeof __NINES_AUTH_ENABLED__ === 'boolean'
    ? __NINES_AUTH_ENABLED__
    : !PUBLIC_VIEWER_MODE && (authEnabledFlag ?? (IS_PRODUCTION ? false : true))
