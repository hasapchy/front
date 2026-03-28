import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
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
})
