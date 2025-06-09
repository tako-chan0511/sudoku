<template>
  <div class="candidate-grid">
    <div v-for="num_val in 9" :key="num_val" class="candidate-item-wrapper">
      <span
        v-if="displayCandidatesMap[num_val as 1]"
        @click.stop="onSmallCellClick(num_val)"
      >
        {{ num_val }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Candidates } from "@/types/sudoku";
import { defineProps, defineEmits, computed } from "vue";
import type { Cell } from '@/types/sudoku';

interface Props {
  autoCandidates: Candidates;
  userCandidates: Candidates;
  isEditable: boolean;
  cellInfo: Cell;
}

const props = defineProps<Props>();

console.log(`[CandidateGrid] Mounted for cell (${props.cellInfo.row}, ${props.cellInfo.col}). userCandidates (props):`, JSON.parse(JSON.stringify(props.userCandidates)));

const emits = defineEmits<{
  (e: "toggleCandidate", n: number): void;
  (e: "selectCell", payload: Cell): void;
}>();

const displayCandidatesMap = computed(() => {
    console.log(`[CandidateGrid] displayCandidatesMap re-evaluating. userCandidates:`, JSON.parse(JSON.stringify(props.userCandidates)));
    // ★重要: ここを userCandidates のみ表示に戻す
    return props.userCandidates;
});


function onSmallCellClick(n: number) {
  console.log(`[CandidateGrid] onSmallCellClick called for candidate ${n}. isEditable: ${props.isEditable}`);

  if (!props.isEditable) {
    console.log(`[CandidateGrid] Not editable, returning.`);
    emits("selectCell", props.cellInfo);
    return;
  }

  emits("selectCell", props.cellInfo);
  console.log(`[CandidateGrid] Emitted 'selectCell' for cell (${props.cellInfo.row}, ${props.cellInfo.col}).`);

  emits("toggleCandidate", n);
  console.log(`[CandidateGrid] Emitted 'toggleCandidate' for: ${n}.`);
}
</script>

<style scoped>
.candidate-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  /* border: 1px solid #ccc;  これは以前から削除済み */
  box-sizing: border-box;
  /* position: relative;  CandidateGridのルート要素には不要、SudokuCellがrelativeなので */
}

/* 各数字のラッパーdiv */
.candidate-item-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /* ★変更点1: position: relative; は削除 */
  /* position: relative; */
  cursor: pointer;
  user-select: none;
}

/* 数字を表示する span 要素のスタイル */
.candidate-item-wrapper span {
  font-size: 0.65rem;
  color: #333;
  font-weight: bold;
  line-height: 1;
}

/* ホバー時の背景色を各divに適用 */
.candidate-item-wrapper:hover {
  background-color: #f0f0f0;
}
</style>