// src/composables/useSudoku.ts の全コード
import { ref, computed } from "vue";
import type { Board, Cell, Candidates, CandidateNumber } from "@/types/sudoku";

const ALL_CANDIDATES: Candidates = { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true };
const EMPTY_CANDIDATES: Candidates = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 9: false };

function cloneCandidates(src: Candidates): Candidates {
  return { ...src };
}

export function useSudoku(initial?: (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[][]) {
  const board = ref<Board>([]);

  function canPlace(r: number, c: number, n: CandidateNumber): boolean {
    for (let col = 0; col < 9; col++) { if (col !== c && board.value[r][col].value === n) return false; }
    for (let row = 0; row < 9; row++) { if (row !== r && board.value[row][c].value === n) return false; }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const rr = br + dr, cc = bc + dc;
        if (!(rr === r && cc === c) && board.value[rr][cc].value === n) return false;
      }
    }
    return true;
  }

  function createEmptyBoard(): Board {
    const b: Board = [];
    for (let r = 0; r < 9; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < 9; c++) {
        row.push({
          row: r, col: c, value: 0, isGiven: false,
          candidates: cloneCandidates(ALL_CANDIDATES),
          userCandidates: cloneCandidates(EMPTY_CANDIDATES),
        });
      }
      b.push(row);
    }
    return b;
  }
  
  function updateAllCandidates() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board.value[r][c];
        if (cell.value !== 0) {
          for (let n = 1; n <= 9; n++) cell.candidates[n as CandidateNumber] = false;
        } else {
          for (let n = 1; n <= 9; n++) cell.candidates[n as CandidateNumber] = canPlace(r, c, n as CandidateNumber);
        }
      }
    }
  }

  function initBoard() {
    const empty = createEmptyBoard();
    if (initial && initial.length === 9 && initial.every((r) => r.length === 9)) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const v = initial[r][c];
          if (v >= 1 && v <= 9) {
            empty[r][c].value = v as CandidateNumber;
            empty[r][c].isGiven = true;
          }
        }
      }
    }
    board.value = empty;
    updateAllCandidates();
  }

  function setCellValue(r: number, c: number, val: 0 | CandidateNumber) {
    const cell = board.value[r][c];
    if (cell.isGiven) return;
    cell.value = val;
    if (val !== 0) {
      for (let n = 1; n <= 9; n++) cell.userCandidates[n as CandidateNumber] = false;
    }
    updateAllCandidates();
  }

  function toggleUserCandidate(r: number, c: number, n: CandidateNumber) {
    const cell = board.value[r][c];
    if (cell.isGiven || cell.value !== 0) return;
    cell.userCandidates[n] = !cell.userCandidates[n];
  }

  // ★★★ トレーニング用に、特定のセルの自動候補を上書きする関数を追加 ★★★
  function setCellCandidates(r: number, c: number, candidatesToSet: CandidateNumber[]) {
    const cell = board.value[r][c];
    if (cell) {
      const newCandidates = cloneCandidates(EMPTY_CANDIDATES);
      candidatesToSet.forEach(n => {
        newCandidates[n] = true;
      });
      cell.candidates = newCandidates;
    }
  }

  function resetBoard() {
    initBoard();
  }

  initBoard();

  const flatCells = computed(() => board.value.flat());

  return { board, flatCells, setCellValue, toggleUserCandidate, resetBoard, updateAllCandidates, setCellCandidates };
}