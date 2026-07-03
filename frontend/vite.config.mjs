import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mister_logo.png'],
      manifest: {
        name: 'Mister OS',
        short_name: 'Mister',
        description: 'Your AI-powered Second Brain',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'mister_logo_192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'mister_logo_512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/.*\/api\/notes/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'notes-api-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              networkTimeoutSeconds: 5,
            }
          },
          {
            urlPattern: /^http:\/\/.*\/api\/finance/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'finance-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              networkTimeoutSeconds: 5,
            }
          }
        ]
      }
    })
  ],
})
