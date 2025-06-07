<template>
  <div class="board">
    <SudokuCell
      v-for="cell in flatCells"
      :key="`${cell.row}-${cell.col}`"
      :cell="cell"
      :selectedNumber="selectedNumber"
      :showCandidates="showCandidates"   :useUserCandidates="useUserCandidates" @selectCell="handleSelectCell"       @toggleCandidate="handleToggleCandidate" />
  </div>
</template>

<script lang="ts" setup>
// import { computed, toRef } from "vue"; // toRef は必要ないかもしれません
import { defineProps, defineEmits } from "vue"; // defineProps, defineEmits を追加
import SudokuCell from "./SudokuCell.vue";
// import { useSudoku } from "@/composables/useSudoku"; // ★useSudoku のインポートを削除（App.vue で一元管理するため）
import type { Cell } from "@/types/sudoku"; // Cell 型をインポート

// App.vue から受け取る props の定義
const props = defineProps<{
  flatCells: Cell[]; // App.vue から flatCells を受け取る
  selectedNumber: number; // App.vue から selectedNumber を受け取る
  showCandidates: boolean; // App.vue から showCandidates を受け取る
  useUserCandidates: boolean; // App.vue から useUserCandidates を受け取る
}>();

// App.vue へイベントを発火するための emits 定義
const emits = defineEmits<{
  // SudokuCell から受け取るペイロードと同じ型を定義
  (e: 'selectCell', payload: { row: number; col: number; val: number }): void;
  (e: 'toggleCandidate', payload: { row: number; col: number; candidate: number }): void;
}>();


// ★以下の onSelectCell と onToggleCandidate は削除します。
// ★これらは useSudoku の関数を直接呼び出しているので、App.vue で呼び出すべきです。
// ★代わりに、App.vue へイベントを emit する関数を定義します。

/** SudokuCell からの selectCell イベントを受け取り、App.vue へ中継 */
function handleSelectCell(payload: { row: number; col: number; val: number }) {
  // ログを追加
  console.log(`[SudokuBoard] handleSelectCell received from SudokuCell: `, payload);
  emits('selectCell', payload); // 受け取ったペイロードをそのままApp.vueへemit
}

/** SudokuCell からの toggleCandidate イベントを受け取り、App.vue へ中継 */
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