function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function toWsOrigin(httpOrigin: string): string {
  // http(s)://host -> ws(s)://host
  if (httpOrigin.startsWith('https://')) return `wss://${httpOrigin.slice(8)}`
  if (httpOrigin.startsWith('http://')) return `ws://${httpOrigin.slice(7)}`
  // Fallback: treat as origin-like
  return httpOrigin
}

function normalizePath(path: string): string {
  if (!path) return ''
  return path.startsWith('/') ? path : `/${path}`
}

function joinUrl(base: string, path: string): string {
  const baseClean = base.endsWith('/') ? base.slice(0, -1) : base
  const pathClean = path.startsWith('/') ? path : `/${path}`
  return `${baseClean}${pathClean}`
}

function readStringEnv(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export const API_BASE_URL: string =
  readStringEnv(import.meta.env.VITE_NINES_BACKEND_URL) ||
  readStringEnv(import.meta.env.VITE_API_URL)

export const API_TOKEN: string | undefined = import.meta.env.VITE_API_TOKEN

function parseBooleanEnv(value: unknown): boolean {
  if (value === undefined || value === null) return false
  const v = String(value).trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

export const OFFLINE_MODE: boolean = parseBooleanEnv(
  import.meta.env.VITE_OFFLINE,
)

function toQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

// You can override the WebSocket URL completely via VITE_NINES_WS_URL.
// Otherwise we derive it from API_BASE_URL + VITE_WS_PATH (default: /ws).
export const WS_URL: string = (() => {
  const explicit =
    readStringEnv(import.meta.env.VITE_NINES_WS_URL) ||
    readStringEnv(import.meta.env.VITE_WS_URL)
  const mode = import.meta.env.VITE_WS_MODE
  const binaryRaw = import.meta.env.VITE_WS_BINARY

  // Server expects binary=1 (string). Accept common truthy values in env.
  const binary = (() => {
    if (binaryRaw === undefined) return undefined
    const v = String(binaryRaw).trim().toLowerCase()
    if (v === '') return undefined
    if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return '1'
    if (v === '0' || v === 'false' || v === 'no' || v === 'off') return '0'
    // If user provided something else, pass through (but 1/0 recommended).
    return String(binaryRaw)
  })()

  const wsQuery = toQueryString({
    ...(mode ? { mode } : {}),
    ...(binary !== undefined ? { binary } : {}),
    ...(API_TOKEN ? { token: API_TOKEN } : {}),
  })

  if (explicit) {
    const separator = explicit.includes('?') ? '&' : '?'
    return wsQuery ? `${explicit}${separator}${wsQuery.slice(1)}` : explicit
  }

  const rawWsPath = import.meta.env.VITE_WS_PATH
  const wsPath = rawWsPath === '' ? '' : normalizePath(rawWsPath ?? '/ws')

  // If API_BASE_URL is absolute, derive WS origin from it.
  if (isAbsoluteHttpUrl(API_BASE_URL)) {
    const api = new URL(API_BASE_URL)
    const wsOrigin = toWsOrigin(api.origin)
    const base = wsPath ? joinUrl(wsOrigin, wsPath) : wsOrigin
    return `${base}${wsQuery}`
  }

  // Otherwise, assume same-origin (works well with Vite dev proxy).
  const origin = window.location.origin
  const wsOrigin = toWsOrigin(origin)
  const base = wsPath ? joinUrl(wsOrigin, wsPath) : wsOrigin
  return `${base}${wsQuery}`
})()
