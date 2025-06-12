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
  // prefilledCandidates?: { row: number, col: number, candidates: CandidateNumber[] }[];
}

// =================================================================
// 1. 隠れたシングル (Hidden Single)
// =================================================================
const hiddenSinglePuzzle: Board = [
  [0, 0, 0,   0, 0, 7,   0, 9, 0],[0, 0, 0,   0, 0, 0,   0, 0, 0],[0, 0, 0,   0, 4, 0,   0, 7, 0],
  [0, 0, 2,   0, 0, 0,   0, 0, 6],[7, 0, 0,   0, 0, 0,   0, 0, 3],[0, 5, 0,   0, 0, 0,   8, 0, 0],
  [0, 9, 0,   1, 0, 0,   0, 0, 0],[0, 0, 7,   0, 8, 0,   0, 0, 0],[0, 4, 0,   0, 0, 6,   0, 0, 0]
];
const hiddenSingleTechnique: TrainingTechnique = {
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
};

// =================================================================
// 2. 予約 (Locked Candidates)
// =================================================================
const lockedCandidatesPuzzle: Board = [
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
  [0,0,0,1,3,9,0,0,0],[0,0,0,0,5,0,0,0,0],[0,0,0,6,7,8,0,0,0],
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]
];
const lockedCandidatesTechnique: TrainingTechnique = {
  key: 'locked-candidates',
  name: '予約 (Locked Candidates)',
  description: 'あるブロック内で特定の候補数字がすべて同じ行に並んでいる場合、その行の他のブロックからはその候補数字を消去できます。ここでは候補 "2" と "4" に注目し、同じ行に並ぶセルから削除してください。',
  puzzle: lockedCandidatesPuzzle,
  highlight: [
    { row: 4, col: 3, type: 'primary' }, { row: 4, col: 5, type: 'primary' },
    { row: 4, col: 0, type: 'secondary' }, { row: 4, col: 1, type: 'secondary' }, { row: 4, col: 2, type: 'secondary' },
    { row: 4, col: 6, type: 'secondary' }, { row: 4, col: 7, type: 'secondary' }, { row: 4, col: 8, type: 'secondary' }
  ],
  removalCandidates: [2, 4]
};

// =================================================================
// 3. ネイキッドペア (Naked Pair)
// =================================================================
const nakedPairPuzzle: Board = [
  [0, 4, 0,   8, 0, 0,   0, 0, 0],[0, 5, 9,   0, 0, 0,   4, 0, 0],[1, 6, 0,   7, 0, 0,   0, 0, 0],
  [7, 0, 8,   0, 0, 0,   0, 0, 0],[0, 0, 0,   0, 0, 0,   0, 0, 0],[0, 0, 0,   0, 0, 0,   0, 0, 0],
  [5, 0, 0,   0, 0, 0,   0, 0, 0],[0, 0, 0,   0, 0, 0,   0, 0, 0],[0, 0, 0,   0, 0, 0,   0, 0, 0]
];
const nakedPairTechnique: TrainingTechnique = {
  key: 'naked-pair',
  name: 'ネイキッドペア (Naked Pair)',
  description: 'この例では、左上ブロック内のセル (0,0) と (2,2) が候補 {2, 3} のペアになっています。したがって、同じブロック内の他のセルから候補 2 と 3 を削除できます。今回の対象は（１，０）（０，２）になります。',
  puzzle: nakedPairPuzzle,
  highlight: [
    { row: 0, col: 0, type: 'primary' }, { row: 2, col: 2, type: 'primary' },
    { row: 1, col: 0, type: 'secondary' }, { row: 0, col: 2, type: 'secondary' },
  ],
  removalCandidates: [2, 3]
};

// =================================================================
// 4. 指向ペア (Pointing Pair)
// =================================================================
const pointingPairPuzzle: Board = [
  [0, 0, 0,   5, 1, 6,   0, 0, 0], [0, 0, 0,   0, 0, 8,   0, 0, 0], [0, 0, 0,   9, 7, 4,   0, 0, 0],
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
];
const pointingPairTechnique: TrainingTechnique = {
  key: 'pointing-pair',
  name: '指向ペア (Pointing Pair)',
  description: 'あるブロック内で特定の候補数字が二つのセルだけにあり、さらにそれらが同じ行に揃っているとき、その行の他のブロックのセルからはその候補数字を消去できます。この例では「3」が中央上のブロック内の(1,4) と (1,5) にしか残っていません。行2（0-based index=1）の他のブロックにあるセル (1,1) と (1,8) から「3」を削除してみましょう。',
  puzzle: pointingPairPuzzle,
  highlight: [
    { row: 1, col: 3, type: 'primary' }, { row: 1, col: 4, type: 'primary' },
    { row: 1, col: 0, type: 'secondary' }, { row: 1, col: 1, type: 'secondary' }, { row: 1, col: 2, type: 'secondary' },
    { row: 1, col: 6, type: 'secondary' }, { row: 1, col: 7, type: 'secondary' }, { row: 1, col: 8, type: 'secondary' },
  ],
  removalCandidates: [2,3]
};

// =================================================================
// 5. X-Wing
// =================================================================
const xWingPuzzle: Board = [
  [0,0,0,0,0,0,0,0,0], [3, 0, 5, 6, 7, 8, 9, 0, 1], [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0], [2, 0, 6, 7, 8, 9, 1, 0, 3], [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0],
];
const xWingTechnique: TrainingTechnique = {
  key: 'x-wing',
  name: 'X-Wing',
  description: '同じ候補数字がちょうど二つの行で、それぞれ同じ二つの列にのみ残っているとき、その二つの列の他の行からはその候補数字を消去できます。この例では候補「4」が行2の (1,1),(1,7) と行5の (4,1),(4,7) にのみ残っています。列2 (0-based col=1) と列8 (col=7) の他の行から「4」を削除してみましょう。',
  puzzle: xWingPuzzle,
  highlight: [
    { row: 1, col: 1, type: 'primary' }, { row: 1, col: 7, type: 'primary' }, { row: 4, col: 1, type: 'primary' }, { row: 4, col: 7, type: 'primary' },
    { row: 0, col: 1, type: 'secondary' }, { row: 2, col: 1, type: 'secondary' }, { row: 3, col: 1, type: 'secondary' }, { row: 5, col: 1, type: 'secondary' },
    { row: 6, col: 1, type: 'secondary' }, { row: 7, col: 1, type: 'secondary' }, { row: 8, col: 1, type: 'secondary' },
    { row: 0, col: 7, type: 'secondary' }, { row: 2, col: 7, type: 'secondary' }, { row: 3, col: 7, type: 'secondary' },
    { row: 5, col: 7, type: 'secondary' }, { row: 6, col: 7, type: 'secondary' }, { row: 7, col: 7, type: 'secondary' }, { row: 8, col: 7, type: 'secondary' }
  ],
  removalCandidates: [4]
};

// =================================================================
// 6. ネイキッドトリプル (Naked Triple)
// =================================================================
const nakedTriplePuzzle: Board = [
  [0, 0, 0, 3,4,6,7,8,9],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]
];
const nakedTripleTechnique: TrainingTechnique = {
  key: 'naked-triple',
  name: 'ネイキッドトリプル (Naked Triple)',
  description: 'ある行で3つのセルだけが候補 {1,2,5} を含んでいる場合、他のセルから 1,2,5 を消去できます。ここでは行1 の (0,0),(0,1),(0,2) が {1,2,5} のトリプルとなっています。',
  puzzle: nakedTriplePuzzle,
  highlight: [
    { row:0, col:0, type:'primary' }, { row:0, col:1, type:'primary' }, { row:0, col:2, type:'primary' },
    { row:1, col:0, type:'secondary' }, { row:1, col:1, type:'secondary' }, { row:1, col:2, type:'secondary' },
    { row:2, col:0, type:'secondary' }, { row:2, col:1, type:'secondary' }, { row:2, col:2, type:'secondary' }
  ],
  removalCandidates: [1,2,5]
};

// =================================================================
// 7. ユニーク矩形 (Unique Rectangle)
// =================================================================
const uniqueRectanglePuzzle: Board = [
  [3, 4, 0,   0, 7, 6,   9, 5, 8],[5, 6, 0,   0, 0, 8,   7, 0, 0],[7, 8, 9,   5, 4, 3,   0, 0, 0],
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]
];
const uniqueRectangleTechnique: TrainingTechnique = {
  key: 'unique-rectangle',
  name: 'ユニーク矩形 (Unique Rectangle)',
  description: 'この例では、 (0,2),(1,2),(0,3),(1,3) の4セルが候補 {1,2} のユニーク矩形を形成しています。これを維持するため、(1,3)の中の９は削除される。もちろんそのあとに(1,4)は１，２が排除され９に確定することになります。',
  puzzle: uniqueRectanglePuzzle,
  highlight: [
    { row: 0, col: 2, type: 'primary' }, { row: 1, col: 2, type: 'primary' }, { row: 0, col: 3, type: 'primary' },
    { row: 1, col: 3, type: 'secondary' },
  ],
  removalCandidates: [9],
  // prefilledCandidates: [
  //   { row: 0, col: 2, candidates: [1, 2] },
  //   { row: 0, col: 3, candidates: [1, 2] },
  //   { row: 1, col: 2, candidates: [1, 2] },
  //   { row: 1, col: 3, candidates: [1, 2, 9] },
  // ]
};

// =================================================================
// 8. バックトラッキング (Guess & Check)
// =================================================================
const backtrackingPuzzle: Board = [
  [1,2,3,4,5,6,7,8,9],[4,5,6,7,8,9,1,2,3],[7,8,9,1,2,3,4,5,6],
  [2,3,4,5,6,7,8,9,1],[5,6,7,8,0,1,2,3,4],[8,9,1,2,3,4,5,6,7],
  [3,4,5,6,7,8,9,1,2],[6,7,8,9,1,2,3,4,5],[9,1,2,3,4,5,6,7,8]
];
const backtrackingTechnique: TrainingTechnique = {
  key: 'backtracking',
  name: 'バックトラッキング (Guess & Check)',
  description: '論理的に進まない場合、セル (4,4) の {2,3} のどちらかを仮置きして進めます。仮置き後に矛盾が出たら、もう一方の数字を試しましょう。',
  puzzle: backtrackingPuzzle,
  highlight: [ { row:4, col:4, type:'primary' } ],
  removalCandidates: []
};


// =================================================================
// エクスポート
// =================================================================
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