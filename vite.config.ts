import { URL, fileURLToPath } from 'node:url'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// devtools removed
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// nitro plugin removed (tanstackStart handles server runtime)
import { defineConfig, loadEnv } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

const config = defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gatewayUrl = env.CLAWDBOT_GATEWAY_URL?.trim() || 'ws://127.0.0.1:18789'

  // Allow access from Tailscale, LAN, or custom domains via env var
  // e.g. CLAWSUITE_ALLOWED_HOSTS=my-server.tail1234.ts.net,192.168.1.50
  const allowedHosts: string[] | true = env.CLAWSUITE_ALLOWED_HOSTS?.trim()
    ? env.CLAWSUITE_ALLOWED_HOSTS.split(',')
        .map((h) => h.trim())
        .filter(Boolean)
    : []
  let proxyTarget = 'http://127.0.0.1:18789'

  try {
    const parsed = new URL(gatewayUrl)
    parsed.protocol = parsed.protocol === 'wss:' ? 'https:' : 'http:'
    parsed.pathname = ''
    proxyTarget = parsed.toString().replace(/\/$/, '')
  } catch {
    // fallback
  }

  return {
    define: {
      'process.env.CLAWDBOT_GATEWAY_URL': JSON.stringify(gatewayUrl),
      'process.env.CLAWDBOT_GATEWAY_TOKEN': JSON.stringify(
        env.CLAWDBOT_GATEWAY_TOKEN || '',
      ),
      ...(!isSsrBuild
        ? {
            'process.env': {},
            'process.platform': '"browser"',
          }
        : {}),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ssr: {
      external: [
        'playwright',
        'playwright-core',
        'playwright-extra',
        'puppeteer-extra-plugin-stealth',
      ],
    },
    optimizeDeps: {
      exclude: [
        'playwright',
        'playwright-core',
        'playwright-extra',
        'puppeteer-extra-plugin-stealth',
      ],
    },
    server: {
      // Force IPv4 — 'localhost' resolves to ::1 (IPv6) on Windows, breaking gateway connectivity
      host: allowedHosts.length > 0 ? '0.0.0.0' : '127.0.0.1',
      allowedHosts: allowedHosts.length > 0 ? [...allowedHosts, '127.0.0.1', 'localhost'] : ['127.0.0.1', 'localhost'],
      proxy: {
        '/gateway-ui': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/gateway-ui/, ''),
          ws: true,
          configure: (proxy) => {
            proxy.on('proxyRes', (_proxyRes) => {
              // Strip iframe-blocking headers so we can embed
              delete _proxyRes.headers['x-frame-options']
              delete _proxyRes.headers['content-security-policy']
            })
          },
        },
      },
    },
    plugins: [
      // devtools(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
      // Copy pty-helper.py into the server assets directory after build
      {
        name: 'copy-pty-helper',
        closeBundle() {
          const src = resolve('src/server/pty-helper.py')
          const destDir = resolve('dist/server/assets')
          const dest = resolve(destDir, 'pty-helper.py')
          if (existsSync(src)) {
            mkdirSync(destDir, { recursive: true })
            copyFileSync(src, dest)
          }
        },
      },
    ],
  }
})

export default config
