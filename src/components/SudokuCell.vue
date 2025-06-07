<!-- src/components/SudokuCell.vue -->
<template>
  <div
    class="cell"
    :class="[borderClasses, { 'given-cell': cell.isGiven }]"
    @click="onClickCell"
  >
    <!-- 候補表示モード ON && セルが空 の場合は候補グリッドを表示 -->
    <CandidateGrid
      v-if="showCandidates && cell.value === 0"
      :useUserCandidates="useUserCandidates"
      :autoCandidates="cell.candidates"
      :userCandidates="cell.userCandidates"
      :isEditable="!cell.isGiven && cell.value === 0"
      @toggleCandidate="onToggleCandidate"
    />

    <!-- OFF のとき、または候補モード OFF なら、確定値 or 空白を表示 -->
    <div v-else class="value-wrapper">
      <span v-if="cell.value !== 0" class="value-display">
        {{ cell.value }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { defineProps, defineEmits } from "vue";
import type { Cell } from "@/types/sudoku";
import CandidateGrid from "./CandidateGrid.vue";

const props = defineProps<{
  cell: Cell;
  showCandidates: boolean;
  useUserCandidates: boolean;
  selectedNumber: number; // 0〜9
}>();

const emits = defineEmits<{
  (e: "selectCell", payload: { row: number; col: number; val: number }): void;
  (e: "toggleCandidate", payload: { row: number; col: number; candidate: number }): void;
}>();

const borderClasses = computed(() => {
  const r = props.cell.row;
  const c = props.cell.col;
  return {
    "border-left-thick":   c % 3 === 0,
    "border-top-thick":    r % 3 === 0,
    "border-right-thick":  c % 3 === 2,
    "border-bottom-thick": r % 3 === 2,
  };
});

function onClickCell() {
  // 候補編集モードのときは CandidateGrid が v-if で邪魔するのでここには来ない
  if (props.cell.isGiven) return;
  // セルをクリック → NumberPicker で選んだ数字で確定
  emits("selectCell", {
    row: props.cell.row,
    col: props.cell.col,
    val: props.selectedNumber,
  });
}

function onToggleCandidate(n: number) {
  emits("toggleCandidate", {
    row: props.cell.row,
    col: props.cell.col,
    candidate: n,
  });
}
</script>

<style scoped>
.cell {
  width: 48px;
  height: 48px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  cursor: pointer;
  border: 1px solid #999;
}
.border-left-thick   { border-left: 3px solid #333 !important; }
.border-top-thick    { border-top: 3px solid #333 !important; }
.border-right-thick  { border-right: 3px solid #333 !important; }
.border-bottom-thick { border-bottom: 3px solid #333 !important; }
.given-cell {
  background-color: #EFEFEF;
  cursor: default;
}
.value-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.value-display {
  font-size: 1.25rem;
  font-weight: bold;
  color: #000;
}
</style>
