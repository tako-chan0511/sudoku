<template>
  <div class="candidate-grid">
    <div
      v-for="n in 9"
      :key="n"
      class="candidate-item-wrapper"
      @click.stop="onSmallCellClick(n)"
    >
      <span v-if="displayCandidatesMap[n]">
        {{ n }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from 'vue';
import type { Cell, CandidateNumber } from '@/types/sudoku';

// Props 定義
const props = defineProps<{
  autoCandidates: CandidateNumber[];
  userCandidates: Record<CandidateNumber, boolean>;
  isEditable: boolean;
  cellInfo: Cell;
  isTraining: boolean;
  hintRemovalApplied: boolean;
  removalCandidates: CandidateNumber[];
  highlightType: string | null;
  supportMode: boolean;
}>();

// Emits 定義
const emit = defineEmits<{
  (e: 'toggleCandidate', candidate: CandidateNumber): void;
  (e: 'selectCell', payload: Cell): void;
}>();

// 空候補マップの初期化
const EMPTY_MAP: Record<CandidateNumber, boolean> = {
  1: false, 2: false, 3: false,
  4: false, 5: false, 6: false,
  7: false, 8: false, 9: false,
};

// 表示候補マップを計算
const displayCandidatesMap = computed((): Record<CandidateNumber, boolean> => {
  const map = { ...EMPTY_MAP };

  // サポートモード ON: 自動候補を表示
  if (props.supportMode) {
    props.autoCandidates.forEach(n => {
      map[n] = true;
    });
    return map;
  }

  // 通常モード（トレーニングでない）: ユーザー候補のみ
  if (!props.isTraining) {
    Object.entries(props.userCandidates).forEach(([k, v]) => {
      map[Number(k) as CandidateNumber] = v;
    });
    return map;
  }

  // トレーニングモード: ヒント未適用 -> 自動候補
  if (!props.hintRemovalApplied) {
    props.autoCandidates.forEach(n => {
      map[n] = true;
    });
    return map;
  }

  // ヒント適用後・secondary -> 自動候補から除外
  if (props.highlightType === 'secondary') {
    props.autoCandidates.forEach(n => {
      map[n] = true;
    });
    props.removalCandidates.forEach(n => {
      map[n] = false;
    });
    return map;
  }

  // それ以外 -> 自動候補のみ
  props.autoCandidates.forEach(n => {
    map[n] = true;
  });
  return map;
});

// セル内クリックハンドラ
function onSmallCellClick(n: CandidateNumber) {
  // 編集モードでなければセル選択のみ
  if (!props.isEditable) {
    emit('selectCell', props.cellInfo);
  } else {
    // 選択後に候補トグル
    emit('selectCell', props.cellInfo);
    emit('toggleCandidate', n);
  }
}
</script>

<style scoped>
.candidate-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.candidate-item-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  user-select: none;
}
.candidate-item-wrapper span {
  font-size: 0.65rem;
  font-weight: bold;
  color: #333;
  line-height: 1;
}
.candidate-item-wrapper:hover {
  background-color: #f0f0f0;
}
</style>
