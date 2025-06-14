# tsconfig.json の内容解説

この設定は **Vue 3 + TypeScript + Vite** の開発に最適化された、シンプルかつ実用的な構成です。

---

## ✅ 全体概要
このファイルは TypeScript の **コンパイル挙動** や **型解決ルール** を制御します。  
Vite と Vue に対応した `.vue` ファイルやモジュールパス補完なども対応済です。

---

## 🔧 compilerOptions の解説

| オプション | 説明 |
| --- | --- |
| `"baseUrl": "."` | 相対パスの基準をプロジェクトルートに設定します（`./src` が `src` で解決可能に） |
| `"paths": { "@/*": ["src/*"] }` | `@/components/Foo.vue` のように @ を src にマッピングします。Vite側でも同様に設定が必要です（`vite.config.ts` で alias） |
| `"types": ["vite/client", "node"]` | `import.meta.env` など Vite 固有型と、Node.js の型定義を有効化します。 |
| `"noEmit": true` | トランスパイル結果を出力しない（.js は生成せず型チェック専用に）。通常 vue-tsc 専用構成です。 |

---

## 📁 include の解説

| パターン例 | 説明 |
| --- | --- |
| `"src/**/*.ts"` | 通常の TypeScript ファイル |
| `"src/**/*.d.ts"` | 型定義ファイル（宣言のみ） |
| `"src/**/*.tsx"` | JSX/TSX（React系使用時） |
| `"src/**/*.vue"` | Vueファイル（`lang="ts"`に対応） |

> Vueプロジェクトでは `.vue` の取り込みが必須です。

---

## ✅ 注意点と補足

- vue-tsc 向け設定になっている
- `"noEmit": true` は型チェックのみ実施し、出力しません。通常、Vite がトランスパイルを担います。
- vue-tsc は `.vue` ファイルを含めた型検査ツールなので、build 時に使うと安全です。

---

## `scripts` 例

```jsonc
"scripts": {
  "build": "vue-tsc -b && vite build"
}
```

---

## ✅ Vite 側に必要な対応（補足）

`vite.config.ts` に以下を追加して、パスエイリアスも一致させてください。

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 💡 今後の発展的オプション（任意）

| オプション名 | 用途 |
| --- | --- |
| `"strict": true` | 厳密な型チェックを全体に適用 |
| `"allowJs": true` | .js ファイルも読み込む（混在プロジェクト用） |
| `"skipLibCheck": true` | ライブラリ型チェックをスキップしビルド高速化 |
| `"target": "ESNext"` | 出力JSのターゲットを指定（Viteで不要なことが多い） |
