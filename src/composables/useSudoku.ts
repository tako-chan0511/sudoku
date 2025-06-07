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
function cloneCandidates(src: Candidates): Candidates {
  return { ...src };
}

export function useSudoku(
  // initial の型は `0 | 1 | ... | 9` の数値リテラル型の二次元配列
  initial?: (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[][]
) {
  const board = ref<Board>([]);

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
    const b: Board = [];
    for (let r = 0; r < 9; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < 9; c++) {
        row.push({
          row: r,
          col: c,
          value: 0,
          isGiven: false, // 初期状態は isGiven: false
          candidates: cloneCandidates(ALL_CANDIDATES),
          userCandidates: cloneCandidates(ALL_CANDIDATES),
        });
      }
      b.push(row);
    }
    return b;
  }

  function initBoard() {
    const empty = createEmptyBoard(); // 全てのセルが isGiven: false で初期化される

    if (
      initial &&
      initial.length === 9 &&
      initial.every((r) => r.length === 9)
    ) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const v = initial[r][c]; // v! を v に変更 (initial のチェックでundefinedは排除)
          if (v >= 1 && v <= 9) {
            empty[r][c].value = v as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
            empty[r][c].isGiven = true; // 問題の数字は isGiven: true
            // Given セルの候補はすべて false にしておく
            for (let n = 1 as 1; n <= 9; n = (n + 1) as 1) {
              empty[r][c].candidates[n] = false;
              empty[r][c].userCandidates[n] = false;
            }
          } else {
            // initial の値が 0 の場合、isGiven は false のままでOK
            empty[r][c].value = 0; // 明示的に 0 に設定
            empty[r][c].isGiven = false; // 明示的に false に設定 (createEmptyBoardで既にfalseだが念のため)
          }
        }
      }
    }
    board.value = empty;
    updateAllCandidates(); // 自動候補を計算
    // userCandidates は空盤面の ALL_CANDIDATES のコピーなので編集可能
  }

  // すべてのセルに対して自動候補を再計算する
  function updateAllCandidates() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board.value[r][c];
        if (cell.value !== 0) {
          // 確定済みセルは自動候補 false
          for (let n = 1 as 1; n <= 9; n = (n + 1) as 1) {
            cell.candidates[n] = false;
          }
        } else {
          // 空セルなら canPlace で判定
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
    // ログの書式を修正
    console.log(`[useSudoku] setCellValue: (${r},${c}), val=${val}, isGiven=${cell.isGiven}`); // ★ログの修正

    if (cell.isGiven) {
      console.log(`[useSudoku] setCellValue: (${r},${c}) はisGivenなので変更不可`); // ★ログの修正
      return;
    }
    cell.value = val;
    console.log(`[useSudoku] setCellValue: (${r},${c}) の値を ${val} に設定しました`); // ★ログの修正
  
    if (val !== 0) {
      // 確定したら、「そのセルの userCandidates は一度クリアしておく」
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
    if (cell.isGiven) return;
    if (cell.value !== 0) return; // 値が確定しているセルでは候補を変更しない
    cell.userCandidates[n] = !cell.userCandidates[n];
  }

  // 盤面を初期状態（Given つき or 空盤面）にリセットする
  function resetBoard() {
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