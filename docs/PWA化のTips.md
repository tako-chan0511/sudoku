# Vue 3 + Vite アプリをPWA化する実践ガイド

このガイドでは、既存のVue 3 + Viteで作成されたアプリケーションを、PWA（Progressive Web App）に対応させるための手順と、よくある問題の解決策（Tips）を紹介します。

---

## PWAとは？

PWAは、Webサイトをネイティブアプリのようにデスクトップやスマートフォンのホーム画面にインストール可能にする技術です。オフラインでも動作します。

---

## PWA化の手順

### ステップ1: 作業ブランチの作成

安全に作業を進めるため、まずPWA化専用の新しいブランチを作成します。

```sh
# ターミナルでプロジェクトのルートディレクトリに移動
git checkout -b feature/pwa-implementation
```

---

### ステップ2: PWAプラグインの導入

ViteプロジェクトのPWA化を簡単にするためのプラグイン [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) をインストールします。

```sh
npm install vite-plugin-pwa -D
```

---

### ステップ3: アプリアイコンの準備

PWAとしてインストールされる際に表示されるアプリアイコンを用意します。  
最低でも以下の2つのサイズのPNG画像を用意し、`public` ディレクトリ直下に配置します。

- `icon-192x192.png`
- `icon-512x512.png`

**フォルダ構成の例:**

```
your-project/
├── public/
│   ├── icon-192x192.png  <-- ここに配置
│   ├── icon-512x512.png  <-- ここに配置
│   └── favicon.ico
├── src/
└── vite.config.ts
```

---

### ステップ4: vite.config.ts の設定

Viteの設定ファイルに、PWAプラグインの読み込みとマニフェストファイル（アプリ情報）の設定を追記します。

> **重要**  
> この設定には、ビルドエラーを防ぐための**パスエイリアス (resolve.alias)**と、GitHub Pagesなどサブディレクトリに公開する場合に必要な**base**の設定が含まれます。

```ts
// vite.config.ts

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pagesなどでサブディレクトリに公開する場合、リポジトリ名を設定
  // 例: https://<USERNAME>.github.io/sudoku/ -> /sudoku/
  base: '/sudoku/', 
  
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // 更新があった場合に自動でリロードする
      devOptions: {
        enabled: true // 開発モードでもPWAの動作確認を可能にする
      },
      manifest: {
        name: '数独 (Sudoku)', // アプリのフルネーム
        short_name: '数独', // ホーム画面に表示される短い名前
        description: 'クラシックな数独パズルゲームです。', // アプリの説明
        start_url: '.', // アプリ起動時のURL
        display: 'standalone', // アドレスバーなどを表示しないネイティブアプリのような表示
        background_color: '#ffffff', // スプラッシュ画面の背景色
        theme_color: '#007acc',      // ツールバーの色
        icons: [
          {
            src: 'icon-192x192.png', // publicディレクトリからの相対パス
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png', // publicディレクトリからの相対パス
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // ビルド時に'@'を'src'として解決するための設定
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

---

### ステップ5: index.html の修正

アプリの玄関口である`index.html`に、PWAとして認識されるための情報を追記します。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- ★★★ ここから追加 ★★★ -->
    <!-- PWAのテーマカラー -->
    <meta name="theme-color" content="#007acc">
    <!-- Web App Manifest ファイルのリンク -->
    <link rel="manifest" href="manifest.webmanifest">
    <!-- ★★★ 追加ここまで ★★★ -->
    
    <title>アプリのタイトル</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

### ステップ6: 動作確認とデプロイ

#### ローカルでの動作確認

```sh
npm run dev
```

Chromeで開き、開発者ツール（F12）の「Application」タブで「Manifest」と「Service Workers」が正しく読み込まれていることを確認します。

#### 変更内容をコミットしてプッシュ

```sh
git add .
git commit -m "feat: PWA化対応を追加"
git push -u origin feature/pwa-implementation
```

#### デプロイ

```sh
npm run deploy
```

---

## Tips: よくある問題と解決策

### 問題: `No manifest detected` と表示される

**解決策:**  
`vite.config.ts`のbase設定が正しいか、`index.html`の`<link rel="manifest" ...>`のパスが正しいかを確認してください。

---

### 問題: インストールアイコンが表示されない

**解決策:**  
アイコンファイルが`public`ディレクトリに正しく配置されているか確認してください。また、ブラウザのキャッシュが原因のことも多いため、キャッシュクリアも試してください。

---

### 問題: `npm run build`で`Cannot find module '@/'`エラーが出る

**解決策:**  
`vite.config.ts`に`resolve.alias`の設定が正しく記述されているかを確認してください。

---
```
