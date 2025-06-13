# CandidateGrid.vue 説明

CandidateGrid.vue は、数独セル内の候補数字（メモ）を9分割で表示する補助UIコンポーネントです。候補入力モード中に、各マス内に小さく数字を表示します。

---

## ✅ 目的と役割

| 項目      | 内容                                             |
|-----------|--------------------------------------------------|
| 主な役割  | セル内に1～9の候補数字を3×3グリッドで表示         |
| 状態依存  | 通常モード／トレーニングモード／ヒントの有無で表示内容を制御 |
| クリック処理 | 候補入力モード中のみ、ユーザー操作により候補をトグル可能 |

---

## 🔧 Props（親からの入力）

```ts
defineProps<{
  autoCandidates: CandidateNumber[];           // 自動解析された候補
  userCandidates: Record<CandidateNumber, boolean>; // ユーザーが入力した候補
  isEditable: boolean;                         // 入力可能かどうか（モード制御）
  cellInfo: Cell;                              // 対象セル情報（row/colなど）
  isTraining: boolean;                         // トレーニングモードか
  hintRemovalApplied: boolean;                 // ヒントが適用されたか
  removalCandidates: CandidateNumber[];        // 削除候補（highlight-secondary向け）
  highlightType: string | null;                // 'primary' / 'secondary' / null
  supportMode: boolean;                        // 自動候補補助モード（ON時は常にauto表示）
}>
```

---

## 📤 Emits（親への通知）

```ts
defineEmits<{
  (e: 'toggleCandidate', candidate: CandidateNumber): void;
  (e: 'selectCell', payload: Cell): void;
}>
```

---

## 🧠 表示ロジック：displayCandidatesMap

候補表示に使う内部状態は computed() で制御されています：

```ts
const displayCandidatesMap = computed(() => {
  const map = { 1: false, ..., 9: false };

  if (supportMode)
    // 常に autoCandidates 表示（補助表示モード）
  else if (!isTraining)
    // 通常モード：ユーザー候補のみ
  else if (!hintRemovalApplied)
    // トレーニングでヒント未使用：自動候補
  else if (highlightType === 'secondary')
    // ヒント使用後・secondary 強調：removal 候補を除外
  else
    // それ以外：自動候補表示
});
```

---

## 🖱 クリック処理

```ts
function onSmallCellClick(n: CandidateNumber) {
  if (!isEditable)
    emit('selectCell', props.cellInfo);
  else {
    emit('selectCell', props.cellInfo);
    emit('toggleCandidate', n);
  }
}
```

- 編集不可：セルを選択するだけ
- 編集可能：セル選択後、指定候補をトグル

---

## 🖼 テンプレート表示

```vue
<div class="candidate-grid">
  <div v-for="n in 9" :key="n" class="candidate-item-wrapper" @click.stop="onSmallCellClick(n)">
    <span v-if="displayCandidatesMap[n]">{{ n }}</span>
  </div>
</div>
```

- 3×3 グリッドに9個のマスを描画
- displayCandidatesMap[n] === true の時だけ数字を表示

---

## 🎨 スタイル（CSS）

- .candidate-grid: 3x3のGrid構造
- .candidate-item-wrapper: 中央寄せ・クリック可能
- span: 小さく太字の数字（候補）

---

## 🧩 このコンポーネントの位置づけ

| 親            | このコンポーネント         | 説明                           |
|---------------|---------------------------|--------------------------------|
| SudokuCell.vue| <CandidateGrid ... />     | 各セル内の候補表示として使用   |
| App.vue       | 間接的に使用              | SudokuCell 経由で盤面に展開   |

---

## 💡 技術的工夫・良ポイント

- 候補の表示ルールを computed で集中管理
- クリック時の選択／トグル処理をシンプルに分岐
- トレーニングモード向けの視覚効果（removalCandidates など）に対応
- .stop ディレクティブでイベント伝播を防止し、意図しないセル選択を抑制

---

## 🔚 結論

この CandidateGrid.vue は、数独アプリの「補助入力と視覚支援」において非常に重要なコンポーネントであり、モード・状態に応じた表示制御が丁寧に設計されています。

---