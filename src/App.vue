<!-- src/App.vue -->
<template>
  <div id="app">
    <h1>数独 (Sudoku)</h1>

    <!-- 候補表示 ON/OFF 切替 -->
    <div class="toggle-buttons">
      <label>
        <input type="checkbox" v-model="showCandidates" />
        候補表示 ON
      </label>
      <label v-if="showCandidates" style="margin-left: 16px;">
        <input type="checkbox" v-model="useUserCandidates" />
        手動候補モード ON
      </label>
    </div>

    <!-- 数字入力パネル -->
    <NumberPicker @pick="onNumberPicked" />
    <div class="selected-display">
      選択中の数字: 
      <strong>{{ selectedNumber === 0 ? "-" : selectedNumber }}</strong>
      <button @click="clearSelection" class="clear-btn">クリア</button>
    </div>

    <!-- リセット・サンプル読み込み -->
    <div class="init-buttons">
      <button @click="loadSamplePuzzle">サンプル盤面を読み込む</button>
      <button @click="clearPuzzle" style="margin-left: 8px;">空盤面</button>
      <button @click="resetAll" style="margin-left: 8px;">リセット</button>
    </div>

    <!-- 9×9 ボードを表示 -->
    <div class="board-wrapper">
      <SudokuCell
        v-for="cell in flatCells"
        :key="`${cell.row}-${cell.col}`"
        :cell="cell"
        :showCandidates="showCandidates"
        :useUserCandidates="useUserCandidates"
        :selectedNumber="selectedNumber"
        @selectCell="onSelectCell"
        @toggleCandidate="onToggleCandidate"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { Cell } from "@/types/sudoku";
import { useSudoku } from "@/composables/useSudoku";
import SudokuCell from "@/components/SudokuCell.vue";
import NumberPicker from "@/components/NumberPicker.vue";

/** サンプル盤面 (Given) の例 */
const samplePuzzle: (0|1|2|3|4|5|6|7|8|9)[][] = [
  [5,3,0,  0,7,0,  0,0,0],
  [6,0,0,  1,9,5,  0,0,0],
  [0,9,8,  0,0,0,  0,6,0],

  [8,0,0,  0,6,0,  0,0,3],
  [4,0,0,  8,0,3,  0,0,1],
  [7,0,0,  0,2,0,  0,0,6],

  [0,6,0,  0,0,0,  2,8,0],
  [0,0,0,  4,1,9,  0,0,5],
  [0,0,0,  0,8,0,  0,7,9],
];

/** 候補表示 ON/OFF */
const showCandidates = ref<boolean>(false);
/** 手動候補モード ON/OFF (=true なら userCandidates を優先表示、false なら autoCandidates を表示) */
const useUserCandidates = ref<boolean>(false);
/** 選択中の数字 (0=クリア, 1〜9=確定数字) */
const selectedNumber = ref<number>(0);

/** useSudoku インスタンスを生成 (最初は空盤面) */
let { board, flatCells, setCellValue, toggleUserCandidate, resetBoard, updateAllCandidates } 
  = useSudoku();

/** サンプル盤面を読み込む */
function loadSamplePuzzle() {
  const api = useSudoku(samplePuzzle);
  board.value           = api.board.value;
  flatCells.value       = api.flatCells.value;
  setCellValue          = api.setCellValue;
  toggleUserCandidate   = api.toggleUserCandidate;
  resetBoard            = api.resetBoard;
  updateAllCandidates   = api.updateAllCandidates;
}

/** 空盤面を作る */
function clearPuzzle() {
  const api = useSudoku();
  board.value           = api.board.value;
  flatCells.value       = api.flatCells.value;
  setCellValue          = api.setCellValue;
  toggleUserCandidate   = api.toggleUserCandidate;
  resetBoard            = api.resetBoard;
  updateAllCandidates   = api.updateAllCandidates;
}

/** すべてリセット (Given も含めて最初の状態に戻す) */
function resetAll() {
  resetBoard();
  selectedNumber.value = 0;
}

/** NumberPicker で数字(1〜9, 0=クリア) を選んだ */
function onNumberPicked(n: number) {
  selectedNumber.value = n;
}
function clearSelection() {
  selectedNumber.value = 0;
}

/** セルがクリックされた：確定値をセット */
function onSelectCell(payload: { row: number; col: number; val: number }) {
  const { row, col, val } = payload;
  setCellValue(row, col, val as 0|1|2|3|4|5|6|7|8|9);
}

/** 候補の小セルがクリックされた：ユーザー候補をトグル */
function onToggleCandidate(payload: { row: number; col: number; candidate: number }) {
  const { row, col, candidate } = payload;
  toggleUserCandidate(row, col, candidate as 1|2|3|4|5|6|7|8|9);
}

const flatCellsRef = flatCells;
</script>

<style>
#app {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  text-align: center;
  font-family: Arial, sans-serif;
}
.toggle-buttons {
  margin-bottom: 12px;
}
.selected-display {
  margin: 8px 0;
}
.clear-btn {
  margin-left: 8px;
}
.init-buttons {
  margin: 12px 0;
}
.board-wrapper {
  display: grid;
  grid-template-columns: repeat(9, 48px);
  grid-template-rows:    repeat(9, 48px);
  border: 2px solid #333;
  margin: 0 auto;
}
</style>
