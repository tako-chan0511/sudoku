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
import type { Cell, Candidates } from '@/types/sudoku';

// Props 定義: ハイライト情報と候補削除フラグも受け取る
const props = defineProps<{
  autoCandidates: Candidates;
  userCandidates: Candidates;
  isEditable: boolean;
  cellInfo: Cell & { highlightType: string | null };
  isTraining: boolean;
  hintRemovalApplied: boolean;
  removalCandidates: number[];
}>();

// Emit 定義
const emits = defineEmits<{
  (e: 'toggleCandidate', n: number): void;
  (e: 'selectCell', payload: Cell): void;
}>();

// 候補表示用マップを computed で生成
const displayCandidatesMap = computed(() => {
  // 1) 通常モードはユーザー候補を表示
  if (!props.isTraining) {
    return props.userCandidates;
  }

  // 2) トレーニング中、ヒント「削除フラグ」が立ったら
  if (props.hintRemovalApplied && props.removalCandidates.length > 0) {
    // autoCandidates をコピーして不要な候補だけ除外
    const filtered: Candidates = { ...props.autoCandidates };
    props.removalCandidates.forEach(n => {
      filtered[n] = false;
    });
    return filtered;
  }

  // 3) それ以外（ヒント前・primaryセルなど）は autoCandidates
  return props.autoCandidates;
});

// 候補セルクリック時の処理
function onSmallCellClick(n: number) {
  // 編集モードでない場合はセル選択のみ
  if (!props.isEditable) {
    emits('selectCell', props.cellInfo);
    return;
  }
  // セル選択と候補トグルを発火
  emits('selectCell', props.cellInfo);
  emits('toggleCandidate', n);
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
  color: #333;
  font-weight: bold;
  line-height: 1;
}

.candidate-item-wrapper:hover {
  background-color: #f0f0f0;
}
</style>
