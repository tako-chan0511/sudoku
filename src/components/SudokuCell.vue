<template>
  <div
    class="sudoku-cell"
    :class="[borderClasses, { 'given-cell': cell.isGiven }]"
    @click="handleMainCellClick" >
    <div v-if="cell.value !== 0" class="value-wrapper">
      <span class="value-display">{{ cell.value }}</span>
    </div>

    <div
      v-else-if="showCandidates"
      class="split-layout"
    >
      <div class="candidate-zone">
        <CandidateGrid
          :useUserCandidates="useUserCandidates"
          :autoCandidates="cell.candidates"
          :userCandidates="cell.userCandidates"
          :isEditable="!cell.isGiven && cell.value === 0 && useUserCandidates"
          @toggleCandidate="onToggleCandidate"
        />
      </div>
      <div
        class="input-zone"
        @click.stop="onClickNumberInputArea" >
        <span v-if="selectedNumber !== 0" class="selected-number-preview">{{ selectedNumber }}</span>
      </div>
    </div>

    <div v-else class="value-wrapper">
      <span v-if="selectedNumber !== 0" class="selected-number-preview">{{ selectedNumber }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from 'vue';
import type { Cell } from '@/types/sudoku';
import CandidateGrid from './CandidateGrid.vue';

const props = defineProps<{
  cell: Cell;
  showCandidates: boolean; // 手動候補モードのON/OFF
  useUserCandidates: boolean; // 手動候補モード時にユーザー候補を使用するか
  selectedNumber: number; // ナンバーピッカーで選択中の数字 (0=クリア)
}>();

// ★追加したログ★
console.log(`[SudokuCell] Cell (${props.cell.row}, ${props.cell.col}) mounted. props.selectedNumber: ${props.selectedNumber}`);

const emits = defineEmits<{
  (e: 'selectCell', payload: { row: number; col: number; val: number }): void;
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

// セル全体のクリックハンドラ（候補モードOFF時、またはsplit-layoutのinput-zoneの親要素で）
function handleMainCellClick() {
  if (props.cell.isGiven) return; // 問題の数字はクリックしても何もしない

  // ★追加したログ★
  console.log(`[SudokuCell] handleMainCellClick for cell (${props.cell.row}, ${props.cell.col}). showCandidates: ${props.showCandidates}, props.selectedNumber: ${props.selectedNumber}`);

  if (!props.showCandidates) {
    // 手動候補モードOFF（通常入力モード）の場合
    emits('selectCell', {
      row: props.cell.row,
      col: props.cell.col,
      val: props.selectedNumber, // 選択中の数字をセルに設定
    });
    console.log(`[SudokuCell] Emitted 'selectCell' (Normal Mode) with val: ${props.selectedNumber}`);
  }
  // 手動候補モードONの場合は、split-layout内の各ゾーンのクリックに任せる。
  // ここでのクリックは、候補のオン/オフの意図があるか、あるいは何もしないか。
  // input-zoneがクリックされた場合はonClickNumberInputAreaが呼ばれる。
}

// split-layout の右側（input-zone）のクリックハンドラ
function onClickNumberInputArea() {
  if (props.cell.isGiven) return; // 問題の数字は変更不可
  // if (props.selectedNumber === 0 && props.cell.value === 0) return; // クリックでセルをクリアしたくない場合はこの行を有効にする

  // ★追加したログ★
  console.log(`[SudokuCell] onClickNumberInputArea for cell (${props.cell.row}, ${props.cell.col}). Emitting val: ${props.selectedNumber}`);

  emits('selectCell', {
    row: props.cell.row,
    col: props.cell.col,
    val: props.selectedNumber, // 選択中の数字をセルに設定
  });
}


function onToggleCandidate(candidate: number) {
  // ★追加したログ★
  console.log(`[SudokuCell] onToggleCandidate for cell (${props.cell.row}, ${props.cell.col}), candidate: ${candidate}`);
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
}
.split-layout {
  display: flex;
  width: 100%;
  height: 100%;
}
.candidate-zone {
  width: 38px;
  height: 100%;
  border-right: 1px solid #eee;
}
.input-zone {
  width: 10px;
  height: 100%;
  background-color: #e0f7e9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.selected-number-preview {
  font-size: 0.8rem;
  color: #007ACC;
  font-weight: bold;
}

/* 罫線スタイル */
.border-left-thick { border-left: 4px solid #4401fe !important; }
.border-top-thick { border-top: 4px solid #4401fe !important; }
.border-right-thick { border-right: 4px solid #4401fe !important; }
.border-bottom-thick { border-bottom: 4px solid #4401fe !important; }

/* given-cell (問題の数字) スタイル */
.given-cell {
  background-color: #EFEFEF;
  cursor: default;
}
.given-cell .value-display {
  color: #333;
}

/* 確定値表示スタイル */
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