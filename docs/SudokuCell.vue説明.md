# SudokuCell.vue 説明

**SudokuCell.vue** は、数独アプリの「1マス（セル）」の表示とインタラクションを担う Vue3 + TypeScript コンポーネントです。構造と役割を以下にまとめます。

---

## ✅ 概要

- **役割**: 盤面の各マスに表示・スタイル・クリック処理を提供する

### 機能

- 固定数字 or 候補数字の表示
- 選択／関連／強調（ハイライト）状態の視覚反映
- `@click` でセル選択や候補数字のトグルを親に通知
- 周囲境界線を厚くして 3×3 ブロックを強調

---

## 🔧 Props（親から渡される値）

```ts
defineProps<{
  cell: Cell;
  inputMode: "confirm" | "thinking";
  isSelected: boolean;
  isRelated: boolean;
  highlightType: "primary" | "secondary" | null;
  isTraining: boolean;
  hintRemovalApplied: boolean;
  removalCandidates: CandidateNumber[];
}>
```

| 名前                | 説明                                  |
|---------------------|---------------------------------------|
| cell                | 対象セルの情報（位置・値・候補など）   |
| inputMode           | 入力モード（確定入力 or 候補モード）   |
| isSelected          | このセルが現在選択中か                 |
| isRelated           | 選択セルと同じ行・列・ブロックにあるか |
| highlightType       | 技法適用の強調種別（primary/secondary）|
| isTraining          | トレーニングモード中かどうか           |
| removalCandidates   | トレーニング時に消すべき候補のリスト   |
| hintRemovalApplied  | ヒント処理がすでに適用されたか         |

---

## 🎯 Emits（親へのイベント通知）

```ts
defineEmits<{
  (e: 'selectCell', payload: Cell): void;
  (e: 'toggleCandidate', payload: { row: number; col: number; candidate: number }): void;
}>
```

| イベント名         | 説明                                        |
|--------------------|---------------------------------------------|
| selectCell         | 親に「このセルを選択して」と通知             |
| toggleCandidate    | 親に「この候補数字をトグルして」と通知       |

---

## 🧠 表示ロジック（テンプレート）

### 1. 数字ありのセル

```vue
<div v-if="cell.value !== 0" class="value-display-wrapper">
  <span class="value-display">{{ cell.value }}</span>
</div>
```
- 問題の確定値やユーザが入力した数字を中央に大きく表示。

### 2. 空白セル（候補入力モード用）

```vue
<CandidateGrid
  :autoCandidates="cell.candidates"
  :userCandidates="cell.userCandidates"
  ...
  @toggleCandidate="onToggleCandidate"
/>
```
- 候補入力時には CandidateGrid を表示
- 入力不可状態（`inputMode !== 'thinking'`）ではクリック無効（`pointerEvents: none`）

---

## 🎨 スタイルと装飾（クラス）

- `.border-left-thick` などで 3×3 ブロック境界を強調
- `.is-selected` で選択中の強調（青枠＋影）
- `.highlight-primary`, `.highlight-secondary` でトレーニング中の強調色
- `.is-related` で同じ行・列・ブロックのマスに薄い背景

---

## 📌 ロジック（script）

### セルクリック処理

```ts
function handleMainCellClick() {
  emits('selectCell', props.cell);
}
```
- セルをクリックしたら親に通知し、選択状態にする

### 候補数字のトグル処理

```ts
function onToggleCandidate(candidate: number) {
  if (props.inputMode !== 'thinking') return;

  if (!props.isSelected) {
    emits('selectCell', props.cell);
    return;
  }

  emits('toggleCandidate', {
    row: props.cell.row,
    col: props.cell.col,
    candidate,
  });
}
```
- 自分が選択中のセルでない場合はまず選択だけ行う
- 選択中であれば `toggleCandidate` を親に通知して状態を変える

---

## 🧩 補足構成要素

- **CandidateGrid.vue**: 候補数字を 3×3 グリッドで表示するサブコンポーネント
- **types/sudoku.ts**: Cell, CandidateNumber, InputMode などの型定義

---

## 📝 コメント付きまとめ

| 要素           | 説明                                                              |
|----------------|-------------------------------------------------------------------|
| 表示           | 数字 or 候補を cell の状態に応じて動的に切替                      |
| スタイル       | 境界線や背景で視覚的に情報を補強                                   |
| インタラクション| セル選択、候補入力、トレーニング強調のクリック処理あり            |
| 分離性         | ロジックや表示の責務が明確に分かれており、拡張が容易              |

---

## 🔚 結論

この **SudokuCell.vue** は、「状態ベースの動的な表示」と「ユーザー操作への反応」を高度に両立したコンポーネントです。**App.vue** との連携も非常に明快です。

> 📦 **CandidateGrid.vue** もご提供いただければ、候補入力UIの実装設計までカバー可能です。必要であれば続けてご共有ください。

---