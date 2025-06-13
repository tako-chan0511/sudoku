# ✅ 概要：trainingPuzzles.ts

このファイルは、数独の解法テクニック別に練習用パズルを定義するためのデータセットです。

各テクニックに応じた盤面（puzzle）と、注目すべきセルや削除すべき候補（highlight, removalCandidates）がまとめられています。

---

## 🧩 型定義の整理

```ts
type SudokuValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Board = SudokuValue[][];
type CandidateNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface TrainingTechnique {
  key: string;
  name: string;
  description: string;
  puzzle: Board;
  highlight: { row: number; col: number; type: 'primary' | 'secondary' }[];
  removalCandidates?: CandidateNumber[];
}
```

### 主な型の役割

| 型名                | 説明                                     |
|---------------------|------------------------------------------|
| SudokuValue         | 数独セルの値（0は空白、1〜9は確定値）    |
| Board               | 9x9 の盤面配列（行×列）                  |
| TrainingTechnique   | テクニックの情報をまとめた構造体。UI描画にも使用される |

---

## 🧪 各テクニックの定義と内容

trainingPuzzles 配列に 8つ の代表的テクニックが用意されています。

1. **隠れたシングル（Hidden Single）**  
   ブロック内で、特定の数（ここでは7）が入る場所が1つしかない場合。  
   highlight でブロック内全体を薄く（secondary）強調し、唯一の場所を太く（primary）表示。

2. **予約（Locked Candidates）**  
   特定の候補が同じ行にしか現れない場合、他ブロックから除去可能。  
   例：候補「2」「4」が 3x3 ブロック内で行に揃っている → 他セルから除去

3. **ネイキッドペア（Naked Pair）**  
   2つのセルがまったく同じ2候補（例：2,3）を持つ → 他のセルからそれらを除外。  
   `removalCandidates: [2, 3]`

4. **指向ペア（Pointing Pair）**  
   特定の候補（例：3）がブロック内で同じ行に限定 → その行の他ブロックから候補除去。  
   highlight で候補が集中しているセルと除去対象セルを区別

5. **X-Wing**  
   特定の候補が同じ列に 2箇所、かつそれが2行に現れる → 他行の同列から除去  
   例：候補「4」が (1,1),(1,7) と (4,1),(4,7) にある → 他行の col=1,7 を除去

6. **ネイキッドトリプル（Naked Triple）**  
   3つのセルで候補が {1,2,5} のみに限定 → 他のセルからこれら候補を除去可能  
   対象は主に行・列の3セルの組み合わせ

7. **ユニーク矩形（Unique Rectangle）**  
   候補が2つずつのセル4つで長方形を形成 → 一部候補が除去されることで矛盾回避  
   「唯一の解」を前提とする論理的テクニック

8. **バックトラッキング（Guess & Check）**  
   すべてのロジックが使い切られた後に仮置き（例：2 or 3）して試行錯誤  
   removalCandidates は使わず、ユーザーに推論を促す

---

## 📦 エクスポート

```ts
export const trainingPuzzles: TrainingTechnique[] = [
  hiddenSingleTechnique,
  lockedCandidatesTechnique,
  nakedPairTechnique,
  pointingPairTechnique,
  xWingTechnique,
  nakedTripleTechnique,
  uniqueRectangleTechnique,
  backtrackingTechnique,
];
```

この配列を UI 側（たとえばレッスン一覧やセレクタ）で利用することで、テクニックの選択や表示が簡単に実現できます。

---

## 📝 補足

### この形式のメリット

- データ駆動で UI を制御できる
- テクニック別に解説・強調・補助ができる
- テストやチュートリアルに最適

---

## ✅ 次のアクション（任意）

- prefilledCandidates（コメントアウト中）を使えば、候補表示付きの練習も可能です。
- 新しいテクニック（Swordfish, XYZ-Wingなど）を追加することも容易です。
