types/sudoku.ts はこの数独アプリケーションにおける型の中心的定義ファイルであり、Vue + TypeScriptの型安全性を実現する基盤となっています。以下に、定義されている各型の役割と利点を丁寧に解説します。

✅ 概要
このファイルでは、数独の状態を構成するための以下の型が定義されています：

カテゴリ	型名	主な用途
セルと盤面構造	Cell, Board	各マスや盤面全体の状態管理
入力・候補	Candidates, CandidateNumber, InputMode, SudokuValue	ユーザー入力・候補管理の補助
保存機能	SavedCellData, SavedPuzzle	LocalStorage への永続化に使用

📦 各型の詳細
1. Candidates型：候補管理マップ
ts
コピーする
編集する
export type Candidates = {
  1: boolean; 2: boolean; ... 9: boolean;
}
1〜9の各数字に対して「候補に含まれるかどうか」を boolean で管理

cell.candidates, cell.userCandidates の形で使用

Record<CandidateNumber, boolean> の具体展開

✅ 利点：

1〜9の候補を定位置で管理できるため、UI描画（グリッド表示）と親和性が高い

booleanで切り替え可能なため、トグル処理が直感的に書ける

2. Cell型：盤面の1マスを表す構造体
ts
コピーする
編集する
export interface Cell {
  row: number;
  col: number;
  value: 0 | 1〜9;
  isGiven: boolean;
  candidates: Candidates;
  userCandidates: Candidates;
}
value: 確定した値（0は空）

isGiven: 初期問題で与えられた数字（trueなら編集不可）

candidates: 自動生成された候補（内部ロジック用）

userCandidates: ユーザーが手動入力した候補（thinkingモード用）

✅ 利点：

候補や選択状態を1つのセルで完結して管理できる

関連ロジック（表示、入力、検証）を単純化できる

3. Board型：9×9の盤面（Cellの2次元配列）
ts
コピーする
編集する
export type Board = Cell[][];
数独盤面を Cell の9行×9列の配列で管理

✅ 利点：

盤面ロジック（行・列・ブロックチェック）を直感的に書ける

flatCells はここからフラット化されて描画用に展開されている

4. InputMode型：入力モードを制限
ts
コピーする
編集する
export type InputMode = 'confirm' | 'thinking';
'confirm': 確定数字入力モード

'thinking': 候補（メモ）入力モード

✅ 利点：

値制限によりバグ防止

スタイル変更・クリック制御に使いやすい

5. CandidateNumber, SudokuValue型
ts
コピーする
編集する
export type CandidateNumber = 1 | 2 | ... | 9;
export type SudokuValue = 0 | 1 | ... | 9;
型安全な数字制限（1〜9のみ、0は空白）

✅ 利点：

誤って10や-1などの値が入り込むことを防げる

forEach((n: CandidateNumber) => ...) のように明確に制限できる

6. SavedCellData型：保存時の1マスデータ
ts
コピーする
編集する
export interface SavedCellData {
  value: Cell['value'];
  isGiven: Cell['isGiven'];
  userCandidates: CandidateNumber[];
}
row/col や candidates（自動候補）は除外

userCandidates は booleanマップから配列へ変換される（圧縮保存）

✅ 利点：

保存データサイズを小さく、シリアライズを簡単に

読み込み時に Candidates オブジェクトへ逆変換可能

7. SavedPuzzle型：1件の保存パズル情報
ts
コピーする
編集する
export interface SavedPuzzle {
  id: string;
  name: string;
  timestamp: number;
  boardData: SavedCellData[][];
  difficulty: "easy" | "medium" | "hard";
}
UUIDで一意識別

ユーザー名と難易度、保存時刻

SavedCellData[][] で構成された盤面情報

✅ 利点：

LocalStorage保存・履歴表示・ロード機能に必要な情報をすべて網羅

ソート（timestamp）やフィルタリング（難易度）も容易に行える

🧠 補足と評価
この型定義はすべて 静的型付けを通じたエラー防止と保守性の向上を目的としています。

とくに Candidates のbooleanマップと CandidateNumber 型の導入は、数独アプリに特化した堅牢な設計です。

Vue 3 + TypeScript の開発において、Props/Emits/Stateの型安全性を高めることで、開発体験・UXの両面で品質向上に貢献しています。

✅ まとめ：型構造全体図
yaml
コピーする
編集する
[Cell] ─┬─ value: SudokuValue (0〜9)
        ├─ isGiven: boolean
        ├─ candidates: Candidates (auto)
        └─ userCandidates: Candidates (manual)
 
[Board] = Cell[][] (9×9)

[SavedPuzzle] ─┬─ id, name, timestamp
               ├─ difficulty: 'easy' | ...
               └─ boardData: SavedCellData[][]

[SavedCellData] = Cellからrow/col除外 + userCandidatesは配列化
📦 これにより App.vue, SudokuCell.vue, CandidateGrid.vue のすべての構造がつながり、型の一貫性により高品質な数独アプリが成立していることが明確になりました。