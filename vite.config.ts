import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Velora Pure',
        short_name: 'Velora Pure',
        theme_color: '#080810',
        background_color: '#080810',
        display: 'standalone',
        icons: [{ src: '/logo.png', sizes: '192x192', type: 'image/png' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 3000000
      }
    })
  ],
})
