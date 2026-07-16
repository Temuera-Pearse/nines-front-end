/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NINES_BACKEND_URL?: string
  readonly VITE_NINES_WS_URL?: string
  readonly VITE_API_URL?: string
  readonly VITE_API_TOKEN?: string
  readonly VITE_DEV_PROXY_TARGET?: string
  readonly VITE_OFFLINE?: string
  readonly VITE_WS_URL?: string
  readonly VITE_WS_PATH?: string
  readonly VITE_WS_MODE?: string
  readonly VITE_WS_BINARY?: string
  readonly VITE_AUTH0_DOMAIN?: string
  readonly VITE_AUTH0_CLIENT_ID?: string
  readonly VITE_AUTH0_AUDIENCE?: string
  readonly VITE_NINES_API_URL?: string
  readonly VITE_PUBLIC_VIEWER_MODE?: string
  readonly VITE_AUTH_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __NINES_PUBLIC_VIEWER_MODE__: boolean
declare const __NINES_AUTH_ENABLED__: boolean
