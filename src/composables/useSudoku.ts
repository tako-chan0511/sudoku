// src/composables/useSudoku.ts
import { ref, computed } from "vue";
import type { Board, Cell, Candidates } from "@/types/sudoku";

// すべて true の候補オブジェクトを返すユーティリティ
const ALL_CANDIDATES: Candidates = {
  1: true,
  2: true,
  3: true,
  4: true,
  5: true,
  6: true,
  7: true,
  8: true,
  9: true,
};

// ★追加：初期状態ですべて false の候補オブジェクトを返すユーティリティ
const EMPTY_CANDIDATES: Candidates = {
  1: false, 2: false, 3: false,
  4: false, 5: false, 6: false,
  7: false, 8: false, 9: false,
};

function cloneCandidates(src: Candidates): Candidates {
  return { ...src };
}

export function useSudoku(
  // initial の型は `0 | 1 | ... | 9` の数値リテラル型の二次元配列
  initial?: (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[][]
) {
  const board = ref<Board>([]);

  console.log('[useSudoku] useSudoku initialized. Initial board:', initial ? 'provided' : 'empty');

  // ガイド：ある数字 n を (r,c) に置けるか
  function canPlace(
    r: number,
    c: number,
    n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  ): boolean {
    // 同じ行
    for (let col = 0; col < 9; col++) {
      if (col !== c && board.value[r][col].value === n) return false;
    }
    // 同じ列
    for (let row = 0; row < 9; row++) {
      if (row !== r && board.value[row][c].value === n) return false;
    }
    // 3×3 ブロック
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const rr = br + dr,
          cc = bc + dc;
        if (!(rr === r && cc === c) && board.value[rr][cc].value === n)
          return false;
      }
    }
    return true;
  }

  // Board を初期化して、Cell を作成する
  function createEmptyBoard(): Board {
    console.log('[useSudoku] createEmptyBoard called.');
    const b: Board = [];
    for (let r = 0; r < 9; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < 9; c++) {
        row.push({
          row: r,
          col: c,
          value: 0,
          isGiven: false,
          candidates: cloneCandidates(ALL_CANDIDATES), // 自動候補は ALL_CANDIDATES からコピー
          userCandidates: cloneCandidates(EMPTY_CANDIDATES), // ★ここを変更：初期状態では全て false の候補からコピー
        });
      }
      b.push(row);
    }
    return b;
  }

  function initBoard() {
    console.log('[useSudoku] initBoard called.');
    const empty = createEmptyBoard();

    if (
      initial &&
      initial.length === 9 &&
      initial.every((r) => r.length === 9)
    ) {
      console.log('[useSudoku] initBoard: Initial puzzle provided.');
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const v = initial[r][c];
          if (v >= 1 && v <= 9) {
            empty[r][c].value = v as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
            empty[r][c].isGiven = true;
            for (let n = 1 as 1; n <= 9; n = (n + 1) as 1) {
              empty[r][c].candidates[n] = false;
              empty[r][c].userCandidates[n] = false; // Given セルは userCandidates も false
            }
          } else {
            empty[r][c].value = 0;
            empty[r][c].isGiven = false;
            empty[r][c].userCandidates = cloneCandidates(EMPTY_CANDIDATES); // ★ここも変更：空セルは userCandidates を全て false に初期化
          }
        }
      }
    } else {
      console.log('[useSudoku] initBoard: Starting with empty board.');
    }
    board.value = empty;
    updateAllCandidates();
  }

  // すべてのセルに対して自動候補を再計算する
  function updateAllCandidates() {
    console.log('[useSudoku] updateAllCandidates called.');
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board.value[r][c];
        if (cell.value !== 0) {
          for (let n = 1 as 1; n <= 9; n = (n + 1) as 1) {
            cell.candidates[n] = false;
          }
        } else {
          for (let n = 1 as 1; n <= 9; n = (n + 1) as 1) {
            cell.candidates[n] = canPlace(r, c, n);
          }
        }
      }
    }
  }

  // セルの値をセット or クリア
  function setCellValue(
    r: number,
    c: number,
    val: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  ) {
    const cell = board.value[r][c];
    console.log(`[useSudoku] setCellValue: (${r},${c}), val=${val}, isGiven=${cell.isGiven}`);

    if (cell.isGiven) {
      console.log(`[useSudoku] setCellValue: (${r},${c}) はisGivenなので変更不可`);
      return;
    }
    cell.value = val;
    console.log(`[useSudoku] setCellValue: (${r},${c}) の値を ${val} に設定しました`);
  
    if (val !== 0) {
      console.log(`[useSudoku] setCellValue: Clearing user candidates for (${r},${c}) after setting value.`);
      for (let n = 1 as 1; n <= 9; n = (n + 1) as 1) {
        cell.userCandidates[n] = false;
      }
    }
    updateAllCandidates();
  }

  // ユーザーが手動で「候補 on/off」を切り替えるときに呼ぶ
  function toggleUserCandidate(
    r: number,
    c: number,
    n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  ) {
    const cell = board.value[r][c];
    console.log(`[useSudoku] toggleUserCandidate: (${r},${c}), candidate=${n}, current=${cell.userCandidates[n]}, isGiven=${cell.isGiven}, value=${cell.value}`);
    if (cell.isGiven) {
      console.log(`[useSudoku] toggleUserCandidate: (${r},${c}) はisGivenなので候補変更不可.`);
      return;
    }
    if (cell.value !== 0) {
      console.log(`[useSudoku] toggleUserCandidate: (${r},${c}) は確定値があるので候補変更不可.`);
      return; // 値が確定しているセルでは候補を変更しない
    }
    cell.userCandidates[n] = !cell.userCandidates[n];
    console.log(`[useSudoku] toggleUserCandidate: (${r},${c}), new value for candidate ${n} is ${cell.userCandidates[n]}`);
  }

  // 盤面を初期状態（Given つき or 空盤面）にリセットする
  function resetBoard() {
    console.log('[useSudoku] resetBoard called.');
    initBoard();
  }

  initBoard(); // useSudoku が呼び出されたときに初期化

  // 描画用に平坦化した Cell[] を computed で返す
  const flatCells = computed(() => board.value.flat());

  return {
    board,
    flatCells,
    setCellValue,
    toggleUserCandidate,
    resetBoard,
    updateAllCandidates,
  };
}