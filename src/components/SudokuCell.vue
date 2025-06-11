<template>
  <div
    class="sudoku-cell"
    :id="`cell-${cell.row}-${cell.col}`"
    tabindex="0"
    :class="[
      borderClasses,
      {
        'given-cell': cell.isGiven,
        'is-selected': isSelected,
        'is-related': isRelated,
        'highlight-primary': highlightType === 'primary',
        'highlight-secondary': highlightType === 'secondary'
      }
    ]"
    @pointerup.prevent.stop="selectCellOnly"
  >
    <!-- 値が入っているときは普通に表示 -->
    <div v-if="cell.value !== 0" class="value-display-wrapper">
      <span class="value-display">{{ cell.value }}</span>
    </div>
    <!-- 候補入力モードのときだけ、CandidateGrid を表示・操作 -->
    <div class="candidate-display-area">
      <CandidateGrid
        :autoCandidates="cell.candidates"
        :userCandidates="cell.userCandidates"
        :isEditable="inputMode === 'thinking' && !cell.isGiven && cell.value === 0"
        :cellInfo="cell"
        :isTraining="isTraining"
        :hintRemovalApplied="hintRemovalApplied"
        :removalCandidates="removalCandidates"
        @toggleCandidate="onToggleCandidate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue';
import type { Cell, InputMode } from '@/types/sudoku';
import CandidateGrid from './CandidateGrid.vue';

const props = defineProps<{        
  cell: Cell;        
  inputMode: InputMode;        
  isSelected: boolean;        
  isRelated: boolean;        
  highlightType: string | null;        
  isTraining: boolean;        
  hintRemovalApplied: boolean;        
  removalCandidates: number[];      }>();
const emits = defineEmits<{ 
  (e: 'selectCell', cell: Cell): void;
  (e: 'toggleCandidate', payload: { row: number; col: number; candidate: number }): void;
}>();

function selectCellOnly() {
  emits('selectCell', props.cell);
}

function onToggleCandidate(candidate: number) {
  emits('toggleCandidate', { row: props.cell.row, col: props.cell.col, candidate });
}
</script>

<style scoped>
.sudoku-cell {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  background-color: #fff;
  border: 1px solid #999;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease-in-out;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}
.sudoku-cell.is-related {
  background-color: #e0f2f7;
}
.sudoku-cell.highlight-secondary {
  background-color: rgba(173, 216, 230, 0.7) !important;
}
.sudoku-cell.highlight-primary {
  background-color: rgba(255, 255, 0, 0.7) !important;
}
.sudoku-cell.is-selected {
  border: 2px solid #007ACC !important;
  box-shadow: 0 0 5px rgba(0, 122, 204, 0.5);
  background-color: #b0e0e6;
}
.border-left-thick { border-left: 2px solid #444 !important; }
.border-top-thick { border-top: 2px solid #444 !important; }
.border-right-thick { border-right: 2px solid #444 !important; }
.border-bottom-thick { border-bottom: 2px solid #444 !important; }
.given-cell {
  background-color: #EFEFEF;
  cursor: default;
}
.given-cell .value-display {
  color: #333;
  font-weight: bold;
}
.value-display-wrapper {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  background-color: transparent;
}
.value-display {
  font-size: 1.5rem;
  font-weight: bold;
  color: #005a9c;
}
.candidate-display-area {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 1;
}
</style>
