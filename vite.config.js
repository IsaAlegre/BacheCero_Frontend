import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// El servicio de IA (FastAPI) no tiene CORS: el navegador le habla a /ia
// y Vite reenvía a localhost:8000 sacando el prefijo.
const iaProxy = {
  '/ia': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/ia/, ''),
  },
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Service worker también en `npm run dev`, para probar la instalación.
      devOptions: { enabled: true },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Bache Cero Posadas',
        short_name: 'Bache Cero',
        description: 'Reportá baches en Posadas y seguí su reparación.',
        lang: 'es-AR',
        start_url: '/vecino',
        scope: '/',
        display: 'standalone',
        background_color: '#f4f6f9',
        theme_color: '#1f3b57',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Nunca cachear las llamadas a la IA ni los fixtures viejos.
        navigateFallbackDenylist: [/^\/ia/],
        // woff2: la fuente va dentro del bundle para que la PWA funcione sin internet.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  server: { proxy: iaProxy },
  preview: { proxy: iaProxy },
})
