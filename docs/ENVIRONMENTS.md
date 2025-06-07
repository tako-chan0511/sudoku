GitHub Pages への Vue 3 (Vite + TypeScript) アプリケーションデプロイにおけるTips
GitHub Pages を利用して Vue 3 (Vite + TypeScript) アプリケーションをデプロイする際、特にローカルでは発生しない問題やTypeScriptのエラーに直面することがあります。以下の点を事前に確認・対策することで、スムーズなデプロイが可能です。

1. vite.config.ts の base オプション設定 (重要)

問題: GitHub Pages の URL は通常 https://<ユーザー名>.github.io/<リポジトリ名>/ の形式になるため、アプリケーション内のリソース（JavaScript、CSS、画像など）へのパスがずれて、デプロイ後に画面が真っ白になることがあります。
解決策: vite.config.ts に base オプションを追加し、リポジトリ名を指定します。
TypeScript

// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/<YOUR_REPOSITORY_NAME>/' // ★ここを追記/修正
})
<YOUR_REPOSITORY_NAME> は、あなたのGitHubリポジトリの正確な名前（例: sudoku）に置き換えてください。
2. package.json のデプロイスクリプト

GitHub Pagesへのデプロイには、gh-pages などのライブラリを使用すると便利です。package.json に以下のスクリプトを追加します。
JSON

// package.json
{
  "name": "sudoku",
  "version": "0.0.0",
  // ...
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "predeploy": "npm run build", // デプロイ前にビルドを実行
    "deploy": "gh-pages -d dist" // ビルド成果物 (distディレクトリ) をGitHub Pagesにプッシュ
  },
  // ...
  "devDependencies": {
    "gh-pages": "^X.Y.Z", // devDependenciesに追加
    // ...
  }
}
gh-pages パッケージをインストールしてください (npm install --save-dev gh-pages)。
3. TypeScript 型エラーの厳密なチェックと修正

問題: ローカル開発環境 (npm run dev) では許容されるTypeScriptのエラーが、デプロイ時のビルド (npm run build) では厳しくチェックされ、ビルドが失敗することがあります。特に、型定義の不一致やプロパティの参照ミスが多いです。
解決策:
.value の参照漏れ: Vueのrefで定義されたリアクティブな値にアクセスする際は、必ず .value を付けてください。
誤: board[row][col] === val
正: board.value[row][col].value === val
イベントペイロードの型定義: コンポーネント間で emit されるイベントのペイロードの型を正確に定義し、受け取る側の関数の引数の型と一致させてください。
例: emits('selectCell', { row, col, val }); と発火する場合、受け取る側は function onSelectCell(payload: { row: number; col: number; val: number }) のように定義します。
computed プロパティの再代入不可: computed プロパティは読み取り専用です。flatCells.value = api.flatCells.value のような直接的な代入はエラーになります。computed は依存するリアクティブな値が更新されれば自動的に再計算されるため、代入は不要です。
引数の型アサーション: 特定の数値リテラル型 (0 | 1 | ... | 9) を期待する関数に、より広い number 型の変数を渡す場合、必要に応じて型アサーション (val as 1|2|...|9) を使用します。
tsconfig.json の設定: strict モードが有効になっているか確認し、TypeScriptの推奨されるベストプラクティスに従ってください。
4. 開発サーバーのキャッシュ対策

問題: ローカル開発中に修正がブラウザに反映されない、または奇妙な挙動が続く場合、ブラウザや開発サーバーのキャッシュが原因であることがあります。
解決策:
ブラウザのハードリロード (Windows: Ctrl + Shift + R, Mac: Cmd + Shift + R) を試す。
開発サーバーを一度停止し、再起動する (npm run dev)。
ブラウザのキャッシュをクリアする。
5. useComposable の一元管理とデータフローの明確化

問題: useSudoku のような Composable を複数のコンポーネントで直接呼び出すと、それぞれが異なるインスタンスとなり、状態の同期が難しくなることがあります。
解決策:
アプリケーションのルートコンポーネント（例: App.vue）で一度だけ Composable を呼び出し、その Composable が提供するリアクティブな状態 (board, flatCells など) やメソッド (setCellValue, shuffleTiles など) を、必要な子コンポーネントに props や emit を通じて渡すように設計します。
これにより、データの流れが明確になり、デバッグが容易になります。