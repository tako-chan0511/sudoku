import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/sudoku/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      devOptions: {
        enabled: true,       // ← 追加: dev モードでも sw.js を生成・登録
        type: 'module',
      },
      manifest: {
        name: 'Sudoku',
        short_name: 'Sudoku',
        /* … 既存の manifest 設定 … */
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // サーバー設定は後回しで OK
})
