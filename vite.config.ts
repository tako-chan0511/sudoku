import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // ★★★ この 'base' の設定が最も重要です ★★★
  base: '/sudoku/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: '数独 (Sudoku)',
        short_name: '数独',
        description: 'クラシックな数独パズルゲームです。',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#007acc',
        icons: [
          {
            src: 'icon-192x192.png', // publicディレクトリに配置したアイコン
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png', // publicディレクトリに配置したアイコン
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
