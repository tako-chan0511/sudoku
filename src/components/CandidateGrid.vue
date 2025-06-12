<template>
  <div class="candidate-grid">
    <div
      v-for="num_val in 9"
      :key="num_val"
      class="candidate-item-wrapper"
      @click.stop="onSmallCellClick(num_val)"
    >
      <span v-if="displayCandidatesMap[num_val]">
        {{ num_val }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from 'vue';
import type { Cell, Candidates, CandidateNumber } from '@/types/sudoku';

const props = defineProps<{
  autoCandidates: Candidates;
  userCandidates: Candidates;
  isEditable: boolean;
  cellInfo: Cell;
  isTraining: boolean;
  hintRemovalApplied: boolean;
  removalCandidates: number[];
  highlightType: string | null;
}>();

const emits = defineEmits<{
  (e: 'toggleCandidate', n: number): void;
  (e: 'selectCell', payload: Cell): void;
}>();

const displayCandidatesMap = computed(() => {
  // 通常モードでは、ユーザー候補のみ表示
  if (!props.isTraining) {
    const hasUserCandidates = Object.values(props.userCandidates).some(v => v);
    return hasUserCandidates ? props.userCandidates : EMPTY_CANDIDATES; // 未入力なら何も表示しない
  }
  
  // --- ここからトレーニングモードのロジック ---
  // ヒント適用前は、自動候補（prefilledCandidatesで上書き済みのもの）を表示
  if (!props.hintRemovalApplied) {
    return props.autoCandidates;
  }
  
  // ヒント適用後、かつ secondary ハイライトのセルは、候補をフィルタリングして表示
  if (props.highlightType === 'secondary') {
    const filtered: Candidates = { ...props.autoCandidates };
    props.removalCandidates.forEach(n => {
      if (filtered[n as CandidateNumber]) {
        filtered[n as CandidateNumber] = false;
      }
    });
    return filtered;
  }
  
  // それ以外のセル（primaryなど）は、そのまま自動候補を表示
  return props.autoCandidates;
});

const EMPTY_CANDIDATES: Candidates = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 9: false };

function onSmallCellClick(n: number) {
  if (!props.isEditable) {
    emits('selectCell', props.cellInfo);
    return;
  }
  emits('selectCell', props.cellInfo);
  emits('toggleCandidate', n);
}
</script>

<style scoped>
.candidate-grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); width: 100%; height: 100%; box-sizing: border-box; }
.candidate-item-wrapper { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; cursor: pointer; user-select: none; }
.candidate-item-wrapper span { font-size: 0.65rem; color: #333; font-weight: bold; line-height: 1; }
.candidate-item-wrapper:hover { background-color: #f0f0f0; }
</style>