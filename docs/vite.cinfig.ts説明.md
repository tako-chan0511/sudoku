# vite.config.ts の構成とその役割

## ✅ vite.config.ts 全体の目的

このファイルは Vite の動作設定ファイルで、以下を担います：

- プロジェクトルートやビルド出力の制御
- プラグインの適用（Vue など）
- パスエイリアスの設定
- 本番用の公開パス設定（GitHub Pages 向け対応など）

---

## 🔍 各行の詳細解説

### 1. インポート部

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
```
- `defineConfig`：型補完と構文補助のための関数（Vite公式推奨）
- `@vitejs/plugin-vue`：.vue ファイルの構文をViteが理解・ビルドできるようにする公式プラグイン
- `path`：Node.js 標準ライブラリ。絶対パス解決のために使う（alias 用）

---

### 2. base の意味

```ts
base: '/sudoku/',
```
- 本番環境でのパスのプレフィックス（`<base href="/sudoku/">` に対応）
- GitHub Pages やサブディレクトリ配信時に必要
- 例：https://tako-chan0511.github.io/sudoku/
- ⚠️ package.json の homepage と一致させてください。

---

### 3. plugins 設定

```ts
plugins: [vue()],
```
- Vue 3 を使うために必須
- .vue ファイルを TypeScript や Vite が理解できる形式に変換する

---

### 4. resolve.alias の役割

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
}
```
- `@/components/MyComp.vue` のように @ を src/ にマッピング
- VSCodeの補完でも有効になる（tsconfig.jsonのpathsと一致必要）

---

## 🧩 GitHub Pages向けまとめ

| 項目            | 設定例                                                        |
|-----------------|--------------------------------------------------------------|
| vite.config.ts  | base: '/sudoku/'                                             |
| package.json    | "homepage": "https://ユーザ名.github.io/sudoku/"             |
| デプロイツール  | gh-pages を使うなら dist/ を指定                             |

---

## ✅ 補足：開発環境では不要

- 開発環境（npm run dev）では base は無視され、ローカルサーバー（localhost:5173 など）がトップルートで動作します。

---

## 💡今後の拡張ポイント（任意）

```ts
server: {
  port: 3000,
  open: true,
}
```
などを追加すれば、開発用の挙動も制御できます。必要なら組み込みをご相談ください。
