// エラー回避のため、必要な型をここで直接定義します。

type SudokuValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Board = SudokuValue[][];

export interface TrainingTechnique {
  key: string;
  name: string;
  description: string;
  puzzle: Board;
  // ヒントで強調表示するセルの情報
  highlight: { row: number; col: number; type: 'primary' | 'secondary' }[];
  // removalCandidates は該当セルから削除すべき候補
  removalCandidates?: (1|2|3|4|5|6|7|8|9)[];
}

// 0 は空きマスを表します

// --- 隠れたシングル (Hidden Single) ---
const hiddenSinglePuzzle: Board = [
  [0, 0, 0,   0, 0, 7,   0, 9, 0],
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   0, 4, 0,   0, 7, 0],

  [0, 0, 2,   0, 0, 0,   0, 0, 6],
  [7, 0, 0,   0, 0, 0,   0, 0, 3],
  [0, 5, 0,   0, 0, 0,   8, 0, 0],

  [0, 9, 0,   1, 0, 0,   0, 0, 0],
  [0, 0, 7,   0, 8, 0,   0, 0, 0],
  [0, 4, 0,   0, 0, 6,   0, 0, 0]
];

// --- 予約（Locked Candidates） ---
const lockedCandidatesPuzzle: Board = [
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   2, 3, 9,   0, 0, 0],  // ブロック内上部の givens
  [0, 0, 0,   0, 5, 0,   0, 0, 0],  // 中央セルのみ givens
  [0, 0, 0,   6, 7, 8,   0, 0, 0],  // ブロック内下部の givens
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   0, 0, 0,   0, 0, 0]
];

// --- ネイキッドペア (Naked Pair) ---
// 左上ブロック内の (0,0),(0,1) が候補 {2,3} となる強引なサンプル
const nakedPairPuzzle: Board = [
  [0, 0, 1,   5, 4, 0,   0, 0, 0],  // (0,2)=1 以外は空欄
  [0, 0, 6,   0, 0, 0,   0, 0, 0],  // (1,0)=4,(1,1)=5,(1,2)=6
  [7, 8, 9,   0, 0, 0,   0, 0, 0],  // (2,0)=7,(2,1)=8,(2,2)=9
  [4, 5, 0,   0, 0, 0,   0, 0, 0],  // 他行は空欄
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   0, 0, 0,   0, 0, 0],
  [0, 0, 0,   0, 0, 0,   0, 0, 0]
];

export const trainingPuzzles: TrainingTechnique[] = [
  {
    key: 'hidden-single',
    name: '隠れたシングル (Hidden Single)',
    description: 'あるブロック（3x3のマス）内で、特定の数字が入る可能性のあるマスが1つしかない状況です。この盤面では、左上のブロックに注目してください。「7」が入るマスはどこでしょう？',
    puzzle: hiddenSinglePuzzle,
    highlight: [
      { row: 0, col: 0, type: 'secondary' }, { row: 0, col: 1, type: 'secondary' }, { row: 0, col: 2, type: 'secondary' },
      { row: 1, col: 0, type: 'secondary' }, { row: 1, col: 1, type: 'secondary' }, { row: 1, col: 2, type: 'secondary' },
      { row: 2, col: 0, type: 'secondary' }, { row: 2, col: 1, type: 'secondary' }, { row: 2, col: 2, type: 'secondary' },
      { row: 1, col: 1, type: 'primary' }
    ]
  },
  {
    key: 'locked-candidates',
    name: '予約 (Locked Candidates)',
    description: 'あるブロック内で特定の候補数字がすべて同じ行に並んでいる場合、その行の他のブロックからはその候補数字を消去できます。ここでは候補 "2" と "4" に注目し、同じ行に並ぶセルから削除してください。',
    puzzle: lockedCandidatesPuzzle,
    highlight: [
      { row: 4, col: 3, type: 'primary' }, // row5,col4
      { row: 4, col: 5, type: 'primary' }, // row5,col6
      { row: 4, col: 0, type: 'secondary' }, // row5,col1
      { row: 4, col: 6, type: 'secondary' }  // row5,col7
    ],
    removalCandidates: [2, 4]
  },
  {
    key: 'naked-pair',
    name: 'ネイキッドペア (Naked Pair)',
    description: 'この例では、左上ブロック内のセル (0,0) と (0,1) が候補 {2, 3} のペアになっています。したがって、同じブロック内の他のセル と同じ行の他のセルから候補 2 と 3 を削除できます。手動でこれらの候補を消してみましょう。',
    puzzle: nakedPairPuzzle,
    highlight: [
      { row: 0, col: 0, type: 'primary' },
      { row: 0, col: 1, type: 'primary' },
      { row: 0, col: 5, type: 'secondary' },
      { row: 0, col: 6, type: 'secondary' },
      { row: 0, col: 7, type: 'secondary' },
      { row: 0, col: 8, type: 'secondary' },
      { row: 1, col: 0, type: 'secondary' },
      { row: 1, col: 1, type: 'secondary' },
    ],
    removalCandidates: [2, 3]
  }
];
