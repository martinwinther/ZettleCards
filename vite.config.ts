import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'ZettleCards - Obsidian Flashcards',
        short_name: 'ZettleCards',
        description: 'Turn your Obsidian and Zettelkasten notes into private, offline-first flashcards with spaced repetition.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        categories: ['productivity', 'education'],
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { 
              cacheName: 'google-fonts-stylesheets', 
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } 
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { 
              cacheName: 'google-fonts-webfonts', 
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } 
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'markdown-vendor': ['marked', 'dompurify', 'highlight.js'],
          'db-vendor': ['dexie']
        }
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false
  }
})
