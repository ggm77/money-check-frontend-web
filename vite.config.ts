import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_API_PROXY_TARGET = 'https://money.seohamin.com'

function normalizeProxyTarget(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return DEFAULT_API_PROXY_TARGET
  }

  const hasProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
  return (hasProtocol ? trimmed : `https://${trimmed}`).replace(/\/+$/, '')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = normalizeProxyTarget(
    env.VITE_API_PROXY_TARGET || env.VITE_API_SERVER_URL || DEFAULT_API_PROXY_TARGET,
  )

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
