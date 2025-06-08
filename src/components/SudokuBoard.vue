<template>
  <div class="board">
    <SudokuCell
      v-for="cell in flatCells"
      :key="`${cell.row}-${cell.col}`"  v-for="cell in flatCells"
      :cell="cell"
      :selectedNumber="selectedNumber"
      :inputMode="inputMode"         :isSelected="isSelected"       @selectCell="handleSelectCell"
      @toggleCandidate="handleToggleCandidate"
    />
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from "vue";
import SudokuCell from "./SudokuCell.vue";
import type { Cell, InputMode } from "@/types/sudoku"; // ★修正：InputMode をインポート

// App.vue から受け取る props の定義
const props = defineProps<{
  flatCells: Cell[]; // App.vue から flatCells を受け取る
  selectedNumber: number; // App.vue から selectedNumber を受け取る
  // showCandidates: boolean; // ★削除：inputMode で制御するため
  // useUserCandidates: boolean; // ★削除：inputMode で制御するため
  inputMode: InputMode;         // ★追加：inputMode を受け取る
  isSelected: boolean;          // ★追加：isSelected を受け取る
}>();

// App.vue へイベントを発火するための emits 定義
const emits = defineEmits<{
  // SudokuCell から受け取るペイロードと同じ型に修正
  (e: 'selectCell', payload: Cell): void; // ★修正：payload を Cell 型にする
  (e: 'toggleCandidate', payload: { row: number; col: number; candidate: number }): void;
}>();


/** SudokuCell からの selectCell イベントを受け取り、App.vue へ中継 */
// ★ここを修正：引数の型を Cell に変更
function handleSelectCell(payload: Cell) { // ★引数の型を Cell に変更
  // ログを追加
  console.log(`[SudokuBoard] handleSelectCell received from SudokuCell: `, payload);
  emits('selectCell', payload); // 受け取ったペイロードをそのままApp.vueへemit
}

/** SudokuCell からの toggleCandidate イベントを受け取り、App.vue へ中中継 */
function handleToggleCandidate(payload: { row: number; col: number; candidate: number }) {
  // ログを追加
  console.log(`[SudokuBoard] handleToggleCandidate received from SudokuCell: `, payload);
  emits('toggleCandidate', payload); // 受け取ったペイロードをそのままApp.vueへemit
}
</script>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(9, 48px);
  grid-template-rows: repeat(9, 48px);
  border: 2px solid #007ACC; /* App.vue の .board-wrapper のスタイルに合わせる */
  margin: 0 auto; /* App.vue の .board-wrapper のスタイルに合わせる */
}
</style>