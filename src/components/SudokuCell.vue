<template>
  <div
    class="sudoku-cell"
    :class="[borderClasses, { 'given-cell': cell.isGiven, 'is-selected': isSelected }]"
    @click="handleMainCellClick" >
    <div v-if="cell.value !== 0" class="value-wrapper">
      <span class="value-display">{{ cell.value }}</span>
    </div>

    <div
      v-else-if="inputMode === 'thinking'"
      class="candidate-display-area" >
      <CandidateGrid
        :autoCandidates="cell.candidates"
        :userCandidates="cell.userCandidates"
        :isEditable="true"
        :cellInfo="cell" @toggleCandidate="onToggleCandidate" />
    </div>

    <div v-else class="value-wrapper">
      </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from 'vue';
import type { Cell } from '@/types/sudoku';
import CandidateGrid from './CandidateGrid.vue';
import type { InputMode } from '@/types/sudoku'; // ★修正：InputMode のインポートパスを '@/types/sudoku' に変更

const props = defineProps<{
  cell: Cell;
  selectedNumber: number;
  inputMode: InputMode;
  isSelected: boolean;
}>();

console.log(`[SudokuCell] Cell (${props.cell.row}, ${props.cell.col}) mounted. Mode: ${props.inputMode}, SelectedNumber: ${props.selectedNumber}, isSelected: ${props.isSelected}`);

const emits = defineEmits<{
  (e: 'selectCell', payload: Cell): void; // Cell選択用
  (e: 'inputCell', payload: { row: number; col: number; val: number }): void; // 数字入力パネルからの入力用 (App.vueが使用)
  (e: 'toggleCandidate', payload: { row: number; col: number; candidate: number }): void; // CandidateGridからの候補トグル用
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

// セル全体のメインクリックハンドラ (セルの選択を行う)
function handleMainCellClick() {
  if (props.cell.isGiven) return; // 問題の数字は変更不可
  // if (props.cell.value !== 0) return; // ★この行を削除★
  // 理由：確定値が入っているセルでも、クリックしたら選択状態になるようにする

  console.log(`[SudokuCell] handleMainCellClick (Cell Select) for cell (${props.cell.row}, ${props.cell.col}).`);
  emits('selectCell', props.cell); // このセルが選択されたことをApp.vueに通知
}

// CandidateGrid からの候補トグルイベントを受け取る（そのままApp.vueへ中継）
function onToggleCandidate(candidate: number) {
  console.log(`[SudokuCell] onToggleCandidate (from CandidateGrid) for cell (${props.cell.row}, ${props.cell.col}), candidate: ${candidate}`);
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
  background-color: #fff;
  border: 1px solid #999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.sudoku-cell.is-selected {
  border: 2px solid #007ACC !important;
  box-shadow: 0 0 5px rgba(0, 122, 204, 0.5);
}
.sudoku-cell.is-selected.border-left-thick,
.sudoku-cell.is-selected.border-top-thick,
.sudoku-cell.is-selected.border-right-thick,
.sudoku-cell.is-selected.border-bottom-thick {
    border-color: #007ACC !important;
}

.candidate-display-area {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.border-left-thick { border-left: 4px solid #4401fe !important; }
.border-top-thick { border-top: 4px solid #4401fe !important; }
.border-right-thick { border-right: 4px solid #4401fe !important; }
.border-bottom-thick { border-bottom: 4px solid #4401fe !important; }

.given-cell {
  background-color: #EFEFEF;
  cursor: default;
}
.given-cell .value-display {
  color: #333;
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