import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

function devApiProxyTarget(env) {
  const override = (env.VITE_DEV_PROXY_TARGET || '').trim()
  if (override) {
    return override
  }
  const raw = (env.VITE_APP_BASE_URL || '').trim()
  return raw || 'http://127.0.0.1'
}

function devProxyConfig(target) {
  return {
    target,
    changeOrigin: true,
    secure: false,
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq, req) => {
        const host = req.headers.host
        if (host) {
          proxyReq.setHeader('X-Forwarded-Host', host)
        }
        proxyReq.setHeader('X-Forwarded-Proto', 'http')
      })
    },
  }
}

function hmrConfig(env) {
  const host = (env.VITE_HMR_HOST || '').trim()
  if (!host) {
    return true
  }
  return {
    protocol: 'ws',
    host,
    port: 5173,
    clientPort: 5173,
  }
}

function devAllowedHosts(env) {
  const extra = (env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
  const fromBase = []
  try {
    const raw = (env.VITE_APP_BASE_URL || '').trim()
    if (raw) {
      fromBase.push(new URL(raw).hostname)
    }
  } catch {}
  return [...new Set([...fromBase, ...extra, 'localhost', '127.0.0.1'])]
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = devApiProxyTarget(env)
  const useDevProxy = mode === 'development'

  return {
    plugins: [
      vue(),
      tailwindcss()
    ],
    build: {
      cssCodeSplit: false,
      modulePreload: {
        resolveDependencies: (_filename, deps) => deps.filter((dep) => !dep.includes('vendor-editor'))
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (id.includes('/node_modules/axios/')) {
              return 'vendor-axios';
            }

            if (id.includes('/node_modules/chart.js/') || id.includes('/node_modules/vue-chartjs/') || id.includes('/node_modules/chartjs-plugin-datalabels/')) {
              return 'vendor-charts';
            }

            if (id.includes('/node_modules/quill/') || id.includes('/node_modules/@vueup/vue-quill/')) {
              return 'vendor-editor';
            }

            if (id.includes('/node_modules/laravel-echo/') || id.includes('/node_modules/pusher-js/')) {
              return 'vendor-realtime';
            }

            if (id.includes('/node_modules/pdfmake/') || id.includes('/node_modules/html2pdf.js/') || id.includes('/node_modules/jsbarcode/')) {
              return 'vendor-docs';
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    publicDir: 'public',
    server: useDevProxy
      ? {
          host: true,
          strictPort: true,
          allowedHosts: devAllowedHosts(env),
          hmr: hmrConfig(env),
          proxy: {
            '/api': devProxyConfig(proxyTarget),
            '/sanctum': devProxyConfig(proxyTarget),
            '/broadcasting': devProxyConfig(proxyTarget),
          },
        }
      : undefined,
  }
})
