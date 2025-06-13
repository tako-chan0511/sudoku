# package.json 説明

この package.json は Vue 3 + TypeScript + Vite による数独アプリのプロジェクト設定ファイルです。

## npm スクリプト

- `npm run dev` → 開発サーバー起動
- `npm run build` → ビルド（型チェック付き）
- `npm run deploy` → GitHub Pages にデプロイ

## 各セクションの解説

- `"name": "sudoku"`  
  プロジェクト名です（任意の識別用）。npm に公開しない場合は特に意味を持ちません。

- `"private": true`  
  npm に公開しないことを明示します。安全のため true を推奨。

- `"version": "0.0.0"`  
  バージョン番号。npm publish しないなら無視してもOK。

- `"type": "module"`  
  Node.js のモジュール形式を "ESM" にする設定です。import / export が使えます。

- `"homepage": "https://tako-chan0511.github.io/Connect4/"`  
  GitHub Pages 用の設定。Vite の base に反映されて、ビルド時のパス指定に利用されます。  
  vite.config.ts 側でも base に合わせる必要があります。

  ```ts
  export default defineConfig({
    base: '/Connect4/',
  })
  ```

## "scripts" セクション

| スクリプト名  | 実行コマンド                        | 説明                        |
|:-------------|:------------------------------------|:----------------------------|
| dev          | vite                               | 開発用ローカルサーバ起動     |
| build        | vue-tsc -b && vite build           | 型チェック → 本番ビルド     |
| preview      | vite preview                       | build後のローカル確認用サーバ|
| predeploy    | npm run build                      | deploy前にビルド            |
| deploy       | gh-pages -d dist                   | distをGitHub Pagesに公開    |

## "dependencies" セクション

| パッケージ   | 用途                       |
|:------------|:---------------------------|
| vue         | Vue 3本体（Composition API）|

## "devDependencies" セクション

| パッケージ名              | 役割                                            |
|:-------------------------|:------------------------------------------------|
| @types/node              | Node.js の型定義                                 |
| @vitejs/plugin-vue       | VueコンポーネントをViteで扱うためのプラグイン    |
| @vue/tsconfig            | Vue向けの公式tsconfigプリセット                  |
| gh-pages                 | distをGitHub Pagesにデプロイするためのツール      |
| typescript               | TypeScriptコンパイラ本体                         |
| vite                     | 超高速ビルドツール・ローカルサーバ               |
| vue-tsc                  | .vueファイルを含む型チェック用TypeScriptツール   |

## 特記事項

- `"build": "vue-tsc -b && vite build"`  
  型エラーがあればビルドを停止できる安全設計。

- `"deploy": "gh-pages -d dist"`  
  GitHub Pages にデプロイする際は、URLベース `/Connect4/` に注意してください。

## 今後の改善ポイント（任意）

| 改善提案                     | 解説                                                      |
|:-----------------------------|:----------------------------------------------------------|
| "homepage" を /sudoku/ に修正 | 実際のプロジェクト名に合っていない可能性があります         |
| ESLint/Prettier 導入         | コード整形と構文チェックを自動化できます                  |
| pinia, vue-router            | 状態管理・画面遷移が必要であれば追加検討                  |
