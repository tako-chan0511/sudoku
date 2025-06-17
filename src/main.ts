// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'   // ← 追加

const updateSW = registerSW({
  onRegistered(r) {
    console.log('Service Worker registered:', r)
  },
  onRegisterError(err) {
    console.error('SW registration error:', err)
  }
})

createApp(App).mount('#app')
