import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { VitePWA } from "vite-plugin-pwa"; // ★ 1. PWAプラグインをインポート

// https://vite.dev/config/
export default defineConfig({
  base: "/sudoku/",
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate", // 更新があった場合に自動でリロードする
      devOptions: {
        enabled: true, // 開発モードでもPWAを有効にする
      },
      manifest: {
        name: "数独 (Sudoku)",
        short_name: "数独",
        description: "クラシックな数独パズルゲームです。",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#007acc",
        icons: [
          {
            src: "icon-192x192.png", // publicディレクトリに配置したアイコン
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512x512.png", // publicディレクトリに配置したアイコン
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
