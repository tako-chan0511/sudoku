<!-- src/components/SudokuBoard.vue -->
<template>
  <div class="board">
    <SudokuCell
      v-for="cell in flatCells"
      :key="`${cell.row}-${cell.col}`"
      :cell="cell"
      :selectedNumber="selectedNumber"
      @selectCell="onSelectCell"
      @toggleCandidate="onToggleCandidate"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, toRef } from "vue";
import SudokuCell from "./SudokuCell.vue";
import { useSudoku } from "@/composables/useSudoku";

// 親の App.vue で管理している selectedNumber を受け取る
const props = defineProps<{
  selectedNumber: number;
}>();
const selectedNumber = toRef(props, "selectedNumber");

const { board, setCellValue, toggleCandidate, flatCells } = useSudoku();

/** セルをクリックしたとき：selectedNumber が 1～9 ならその値を確定、0 ならセルをクリア */
function onSelectCell(cell: typeof flatCells.value[number]) {
  const n = selectedNumber.value;
  if (n >= 1 && n <= 9) {
    setCellValue(cell.row, cell.col, n as any);
  } else if (n === 0) {
    // クリアするとき：Cell.value = 0 と候補をすべて再セットする
    // useSudoku に「クリア専用メソッド」を用意しておくと便利です
    // ここでは一旦「setCellValue を 0 で呼び出せる」前提で書いています
    setCellValue(cell.row, cell.col, 0 as any);
  }
}

/** 右クリックで候補トグル */
function onToggleCandidate(payload: { cell: any; n: number }) {
  const { cell, n } = payload;
  toggleCandidate(cell.row, cell.col, n as any);
}
</script>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(9, 48px);
  grid-template-rows:    repeat(9, 48px);
  border: 2px solid #333;
}
</style>
