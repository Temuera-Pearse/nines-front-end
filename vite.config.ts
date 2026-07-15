/// <reference types="node" />

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    env.VITE_DEV_PROXY_TARGET ||
    env.VITE_NINES_BACKEND_URL ||
    'https://king-prawn-app-a39mi.ondigitalocean.app'
  const wsTarget = proxyTarget.replace(/^http/i, 'ws')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
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
