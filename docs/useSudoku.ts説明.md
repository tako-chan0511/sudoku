useSudoku.ts は Vue 3 における Composable関数 で、数独の状態管理とロジック（候補計算・初期化・入力処理など）をカプセル化しています。Vue + TypeScript + Composition API の正統的な実装であり、再利用性と保守性を高めています。

以下、構造・目的・関数別役割を詳細に解説します。

✅ 概要：useSudoku の全体像
ts
コピーする
編集する
export function useSudoku(initial?: number[][])
引数 initial: 9×9の初期盤面を受け取る（任意）

返却オブジェクト: 以下の機能を提供

返却名	型	説明
board	Ref<Board>	盤面（2次元配列）のリアクティブ変数
flatCells	ComputedRef<Cell[]>	コンポーネント描画用のフラットな配列
setCellValue	関数	セルに値をセット（候補も更新）
toggleUserCandidate	関数	手動候補をON/OFF
setCellCandidates	関数	特定セルの候補を一括更新
resetBoard	関数	盤面を初期化
updateAllCandidates	関数	全セルの自動候補を再計算

🧩 内部構造のポイント
1. board: Ref<Board>
リアクティブな盤面状態

各 Cell には value, isGiven, 自動候補、手動候補 が含まれる

描画やイベント処理での中心的データ

🔧 関数別解説
✅ createEmptyBoard()
空の盤面（value=0, 候補=全部ON, 手動候補=全部OFF）を生成

ts
コピーする
編集する
row.push({
  row: r, col: c,
  value: 0, isGiven: false,
  candidates: cloneCandidates(ALL_CANDIDATES),
  userCandidates: cloneCandidates(EMPTY_CANDIDATES),
});
✅ canPlace(r, c, n)
数独ルールに従って、(r,c) に n を置けるか判定

判定ロジック：

項目	条件
同一行	その行に n がないか
同一列	その列に n がないか
同一3×3ブロック	そのブロックに n がないか

✅ updateAllCandidates()
全セルに対して canPlace を用い、candidates を更新

value !== 0 の場合は候補すべて無効化

✅ initBoard()
initial 配列から初期状態を作成

value >= 1 のセルは isGiven = true で固定値にする

✅ setCellValue(r, c, val)
指定セルに値（1〜9 or 0）をセット

手動候補をリセット（値を確定したら候補は不要になるため）

自動候補を再計算

ts
コピーする
編集する
if (val !== 0) {
  for (let n = 1; n <= 9; n++) cell.userCandidates[n as CandidateNumber] = false;
}
✅ toggleUserCandidate(r, c, n)
ユーザーが手動で候補をON/OFFする（thinkingモードで使用）

value !== 0 または isGiven の場合は無視

✅ setCellCandidates(r, c, candidatesToSet)
数字配列で指定された候補を設定

Candidates 形式に変換して上書き

✅ resetBoard()
初期状態に盤面を戻す（initBoard() を再呼び出し）

✅ flatCells
Board（9×9の2次元配列）を .flat() で1次元化した ComputedRef

Vueの v-for に便利

ts
コピーする
編集する
const flatCells = computed(() => board.value.flat());
🧠 設計面での良さ
観点	内容
再利用性	Composableとして setup() から何度でも呼べる
型安全性	TypeScriptで Candidates, Cell, CandidateNumber 等を厳密管理
Vue流儀	ref, computed, reactivity を適切に使用
数独に特化	候補管理、確定値の入力、3x3ブロックの扱いなどロジックが明快

🧩 呼び出し例（想定）
ts
コピーする
編集する
const { board, setCellValue, toggleUserCandidate } = useSudoku(initialBoard);
Vueコンポーネント側から setCellValue(2, 3, 5) や toggleUserCandidate(4, 4, 7) で操作できます。

✅ まとめ：useSudokuの責務
機能	役割
状態保持	board, flatCells
初期化	initBoard, resetBoard
自動候補更新	updateAllCandidates, canPlace
ユーザー操作	setCellValue, toggleUserCandidate, setCellCandidates

このように、**「ロジックは useSudoku に集約し、UIは純粋な描画に専念」**という理想的な責務分離が実現されています。

必要であれば、このComposableに以下の機能追加も検討可能です：

値のUNDO/REDO対応（履歴管理）

エラーチェック（重複警告）

解答の自動チェック