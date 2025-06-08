<template>
  <div
    class="sudoku-cell"
    :class="[borderClasses, { 'given-cell': cell.isGiven, 'is-selected': isSelected }]"
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
import type { Cell, InputMode } from '@/types/sudoku'; // ★修正：InputMode もここからインポート
import CandidateGrid from './CandidateGrid.vue';

const props = defineProps<{
  cell: Cell;
  selectedNumber: number; // このpropはSudokuCell内では直接使わないが、親からの情報として保持
  inputMode: InputMode; // 新しいinputModeを渡す
  isSelected: boolean;
}>();

console.log(`[SudokuCell] Cell (${props.cell.row}, ${props.cell.col}) mounted.`);

const emits = defineEmits<{
  (e: 'selectCell', payload: Cell): void;
  (e: 'inputCell', payload: { row: number; col: number; val: number }): void;
  (e: 'toggleCandidate', payload: { row: number; col: number; candidate: number }): void;
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
  // isGivenセルは変更不可だが、選択状態にはできる
  // if (props.cell.isGiven) return; // この行は削除、App.vue側で変更不可のチェックをしている
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
  background-color: #fff;
  border: 1px solid #999;
  display: flex; /* flexboxで子要素を配置 */
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

/* ★変更点3: 確定値のラッパーを追加し、候補と重ねて表示できるように position: absolute を追加 */
.value-display-wrapper {
  position: absolute; /* 親セル基準で位置を決定 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2; /* 候補より手前に表示 */
  background-color: transparent; /* 背景透過 */
}

.value-display {
  font-size: 1.5rem; /* 確定値は少し大きく */
  font-weight: bold;
  color: #000;
}

/* ★変更点4: 候補表示エリアのスタイリング調整 */
.candidate-display-area {
  position: absolute; /* 親セル基準で位置を決定 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* flexbox は CandidateGrid 内で制御 */
  z-index: 1; /* 確定値より奥に表示 */
}

/* 確定値があるセルに候補を表示しない、または薄く表示するスタイル */
.sudoku-cell .candidate-display-area:has(+ .value-display-wrapper > .value-display:not(:empty)) {
    /* CSS :has() 擬似クラスを使用して、確定値のspanが存在する場合に候補表示を非表示にする */
    /* ただし、:has() は比較的新しいCSS機能なので、対応ブラウザを確認してください */
    /* もし:has()が使えない場合、JSで isDisplayCandidates などのcomputedプロパティをセルに追加して制御します */
    display: none; /* 確定値がある場合は候補を完全に非表示 */
}
/* より良い代替案は、Vueのロジックで isEditable と同じように isDisplayCandidates を渡すことです */


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
</style>