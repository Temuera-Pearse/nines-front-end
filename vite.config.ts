/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function readLocalHttpsConfig() {
  const certPath = resolve(process.cwd(), '.certs/nines-local.pem')
  const keyPath = resolve(process.cwd(), '.certs/nines-local-key.pem')

  if (!existsSync(certPath) || !existsSync(keyPath)) {
    return undefined
  }

  return {
    cert: readFileSync(certPath),
    key: readFileSync(keyPath),
  }
}

function readBooleanEnv(value: string | undefined): boolean | null {
  const raw = value?.trim().toLowerCase()
  if (!raw) return null
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true
  if (['0', 'false', 'no', 'off'].includes(raw)) return false
  return null
}

function isLocalDevelopmentUrl(value: string): boolean {
  return /^(?:https?|wss?):\/\/(?:localhost|127\.0\.0\.1|192\.168\.)/i.test(
    value,
  )
}

function assertProductionUrl(
  name: string,
  value: string | undefined,
  protocol: 'https' | 'wss',
) {
  const url = value?.trim()
  if (!url) {
    throw new Error(`${name} is required for production builds`)
  }
  if (!url.startsWith(`${protocol}://`)) {
    throw new Error(`${name} must use ${protocol.toUpperCase()} in production`)
  }
  if (isLocalDevelopmentUrl(url)) {
    throw new Error(`${name} must not use a local development host in production`)
  }
}

function assertOptionalProductionUrl(
  name: string,
  value: string | undefined,
  protocol: 'https' | 'wss',
) {
  if (!value?.trim()) return
  assertProductionUrl(name, value, protocol)
}

function assertProductionBuildConfig(env: Record<string, string>) {
  const publicViewerMode =
    readBooleanEnv(env.VITE_PUBLIC_VIEWER_MODE) ?? true
  const authEnabled = readBooleanEnv(env.VITE_AUTH_ENABLED) ?? false
  const offlineMode = readBooleanEnv(env.VITE_OFFLINE) ?? false

  if (!publicViewerMode && authEnabled) {
    throw new Error(
      'Production auth-enabled builds must explicitly disable public viewer mode',
    )
  }

  if (offlineMode) return

  assertOptionalProductionUrl(
    'VITE_NINES_BACKEND_URL or VITE_API_URL',
    env.VITE_NINES_BACKEND_URL || env.VITE_API_URL,
    'https',
  )
  const wsUrl = env.VITE_NINES_WS_URL || env.VITE_WS_URL
  const apiUrl = env.VITE_NINES_BACKEND_URL || env.VITE_API_URL
  if (wsUrl) {
    assertProductionUrl('VITE_NINES_WS_URL or VITE_WS_URL', wsUrl, 'wss')
  } else {
    assertProductionUrl(
      'VITE_NINES_BACKEND_URL or VITE_API_URL',
      apiUrl,
      'https',
    )
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const publicViewerMode =
    readBooleanEnv(env.VITE_PUBLIC_VIEWER_MODE) ?? (mode === 'production')
  const authEnabled =
    !publicViewerMode &&
    (readBooleanEnv(env.VITE_AUTH_ENABLED) ?? mode !== 'production')

  if (command === 'build' && mode === 'production') {
    assertProductionBuildConfig(env)
  }

  const proxyTarget =
    env.VITE_DEV_PROXY_TARGET ||
    env.VITE_NINES_BACKEND_URL ||
    'https://king-prawn-app-a39mi.ondigitalocean.app'
  const ninesApiProxyTarget = env.NINES_API_PROXY_TARGET || proxyTarget
  const wsTarget = proxyTarget.replace(/^http/i, 'ws')

  return {
    plugins: [react()],
    define: {
      __NINES_PUBLIC_VIEWER_MODE__: JSON.stringify(publicViewerMode),
      __NINES_AUTH_ENABLED__: JSON.stringify(authEnabled),
    },
    build: {
      sourcemap: false,
    },
    server: {
      port: 5173,
      open: true,
      https: command === 'serve' ? readLocalHttpsConfig() : undefined,
      proxy: {
        '/health': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/race': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/bets': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: ninesApiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: wsTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
