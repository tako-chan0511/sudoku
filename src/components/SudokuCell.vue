<template>
  <div
    class="cell"
    :class="[borderClasses, { 'given-cell': cell.isGiven }]"
    @click="!showCandidates && onClickCell()"
  >
    <!-- 候補表示ONかつセルが空の場合は左右2分割レイアウト -->
    <div
      v-if="showCandidates && cell.value === 0"
      class="split-layout"
    >
      <!-- 左側: 候補グリッド -->
      <div class="candidate-zone">
        <CandidateGrid
          :useUserCandidates="useUserCandidates"
          :autoCandidates="cell.candidates"
          :userCandidates="cell.userCandidates"
          :isEditable="!cell.isGiven && cell.value === 0"
          @toggleCandidate="onToggleCandidate"
        />
      </div>
      <!-- 右側: 選択中数字入力エリア -->
      <div
        class="input-zone"
        @click.stop="onClickCell"
      >
        <!-- ここは空白、クリックで値を確定 -->
      </div>
    </div>

    <!-- 通常時: 候補表示OFF または direct-input時、既存ロジック -->
    <CandidateGrid
      v-else-if="showCandidates && cell.value === 0 && !useCandidateSplit"
      :useUserCandidates="useUserCandidates"
      :autoCandidates="cell.candidates"
      :userCandidates="cell.userCandidates"
      :isEditable="!cell.isGiven && cell.value === 0"
      @toggleCandidate="onToggleCandidate"
    />
    <div v-else-if="cell.value !== 0" class="value-wrapper">
      <span class="value-display">{{ cell.value }}</span>
    </div>
    <div v-else class="value-wrapper"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from 'vue';
import type { Cell } from '@/types/sudoku';
import CandidateGrid from './CandidateGrid.vue';

const props = defineProps<{
  cell: Cell;
  showCandidates: boolean;
  useUserCandidates: boolean;
  selectedNumber: number;
}>();

const emits = defineEmits<{
  (e: 'selectCell', payload: { row: number; col: number; val: number }): void;
  (e: 'toggleCandidate', payload: { row: number; col: number; candidate: number }): void;
}>();

const borderClasses = computed(() => {
  const r = props.cell.row;
  const c = props.cell.col;
  return {
    'border-left-thick':   c % 3 === 0,
    'border-top-thick':    r % 3 === 0,
    'border-right-thick':  c % 3 === 2,
    'border-bottom-thick': r % 3 === 2,
  };
});

function onClickCell() {
  if (props.cell.isGiven) return;
  emits('selectCell', {
    row: props.cell.row,
    col: props.cell.col,
    val: props.selectedNumber,
  });
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
.cell {
  width: 48px;
  height: 48px;
  box-sizing: border-box;
  position: relative;
  background-color: #fff;
  border: 1px solid #999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.split-layout {
  display: flex;
  width: 100%;
  height: 100%;
}
.candidate-zone {
  width: 38px;
  height: 100%;
}
.input-zone {
  width: 10px;
  height: 100%;
  background-color: #e0f7e9;
  cursor: pointer;
}
.border-left-thick   { border-left: 4px solid #4401fe !important; }
.border-top-thick    { border-top: 4px solid #4401fe !important; }
.border-right-thick  { border-right: 4px solid #4401fe !important; }
.border-bottom-thick { border-bottom: 4px solid #4401fe !important; }
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
