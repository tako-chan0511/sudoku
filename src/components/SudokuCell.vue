<template>
  <div
    class="sudoku-cell"
    :class="[
      borderClasses,
      {
        'given-cell': cell.isGiven,
        'is-selected': isSelected,
        'is-related': isRelated // ★変更点1: isRelated クラスを追加
      }
    ]"
    @click="handleMainCellClick"
  >
    <div v-if="cell.value !== 0" class="value-display-wrapper">
      <span class="value-display">{{ cell.value }}</span>
    </div>

    <div class="candidate-display-area">
      <CandidateGrid
        :autoCandidates="cell.candidates"
        :userCandidates="cell.userCandidates"
        :isEditable="inputMode === 'thinking' && !cell.isGiven && cell.value === 0"
        :cellInfo="cell"
        @toggleCandidate="onToggleCandidate"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from 'vue';
import type { Cell, InputMode } from '@/types/sudoku';
import CandidateGrid from './CandidateGrid.vue';

const props = defineProps<{
  cell: Cell;
  selectedNumber: number;
  inputMode: InputMode;
  isSelected: boolean;
  isRelated: boolean; // ★変更点2: isRelated プロパティを受け取る
}>();

console.log(`[SudokuCell] Cell (${props.cell.row}, ${props.cell.col}) mounted.`);

const emits = defineEmits<{
  (e: 'selectCell', payload: Cell): void;
  (e: 'inputCell', payload: { row: number; col: number; val: number }): void;
  (e: 'toggleCandidate', payload: { row: number; col; candidate: number }): void;
}>();

const borderClasses = computed(() => {
  const r = props.cell.row;
  const c = props.cell.col;
  return {
    'border-left-thick': c % 3 === 0,
    'border-top-thick': r % 3 === 0,
    'border-right-thick': c % 3 === 2,
    'border-bottom-thick': r % 3 === 2,
  };
});

function handleMainCellClick() {
  emits('selectCell', props.cell);
}

function onToggleCandidate(candidate: number) {
  emits('toggleCandidate', {
    row: props.cell.row,
    col: props.cell.col,
    candidate,
  });
}
</script>

<style scoped>
.sudoku-cell {
  width: 48px;
  height: 48px;
  box-sizing: border-box;
  position: relative;
  background-color: #fff; /* デフォルトの背景色 */
  border: 1px solid #999;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out, background-color 0.15s ease-in-out; /* ★変更点4: background-color もトランジション対象に追加 */
}

/* ★変更点3: 関連セル用のスタイルを追加 */
.sudoku-cell.is-related {
  background-color: #e0f2f7; /* 薄い水色の背景色 */
}

/* 選択セルは関連セルのスタイルを上書きするように、より優先順位を高くする */
.sudoku-cell.is-selected {
  border: 2px solid #007ACC !important;
  box-shadow: 0 0 5px rgba(0, 122, 204, 0.5);
  background-color: #b0e0e6; /* 選択セルの背景色は、関連セルの色より少し濃くするなどして区別する */
}
.sudoku-cell.is-selected.border-left-thick,
.sudoku-cell.is-selected.border-top-thick,
.sudoku-cell.is-selected.border-right-thick,
.sudoku-cell.is-selected.border-bottom-thick {
    border-color: #007ACC !important;
}

/* 3x3ブロックの太いボーダーはそのまま */
.border-left-thick { border-left: 4px solid #4401fe !important; }
.border-top-thick { border-top: 4px solid #4401fe !important; }
.border-right-thick { border-right: 4px solid #4401fe !important; }
.border-bottom-thick { border-bottom: 4px solid #4401fe !important; }

/* 与えられた初期値セルのスタイルはそのまま */
.given-cell {
  background-color: #EFEFEF;
  cursor: default;
}
.given-cell .value-display {
  color: #333;
}

/* 値と候補のラッパー、それぞれのスタイルはそのまま */
.value-display-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  background-color: transparent;
}
.value-display {
  font-size: 1.5rem;
  font-weight: bold;
  color: #000;
}
.candidate-display-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 確定値があるセルに候補を表示しないスタイルはそのまま */
.sudoku-cell .candidate-display-area:has(+ .value-display-wrapper > .value-display:not(:empty)) {
    display: none;
}
</style>