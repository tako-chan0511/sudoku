import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'  

// https://vite.dev/config/
export default defineConfig({
  base: '/sudoku/',
  plugins: [vue()],
   resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

})
