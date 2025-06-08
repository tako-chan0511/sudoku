<template>
  <div class="candidate-grid">
    <div v-for="num_val in 9" :key="num_val" :class="`pos-${num_val}`">
      <span v-if="displayCandidatesMap[num_val as 1]" 
            @click.stop="onSmallCellClick(num_val)"> 
        {{ num_val }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Candidates } from "@/types/sudoku";
import { defineProps, defineEmits, computed } from "vue";
import type { Cell } from '@/types/sudoku';

interface Props {
  autoCandidates: Candidates;
  userCandidates: Candidates;
  isEditable: boolean;
  cellInfo: Cell;
}

const props = defineProps<Props>();

console.log(`[CandidateGrid] Mounted for cell (${props.cellInfo.row}, ${props.cellInfo.col}). userCandidates (props):`, JSON.parse(JSON.stringify(props.userCandidates)));

const emits = defineEmits<{
  (e: "toggleCandidate", n: number): void;
  (e: "selectCell", payload: Cell): void;
}>();

const displayCandidatesMap = computed(() => {
    console.log(`[CandidateGrid] displayCandidatesMap re-evaluating. userCandidates:`, JSON.parse(JSON.stringify(props.userCandidates)));
    return props.userCandidates;
});

function onSmallCellClick(n: number) {
  console.log(`[CandidateGrid] onSmallCellClick called for candidate ${n}. isEditable: ${props.isEditable}`);

  if (!props.isEditable) {
    console.log(`[CandidateGrid] Not editable, returning.`);
    return;
  }

  emits("selectCell", props.cellInfo);
  console.log(`[CandidateGrid] Emitted 'selectCell' for cell (${props.cellInfo.row}, ${props.cellInfo.col}).`);

  emits("toggleCandidate", n);
  console.log(`[CandidateGrid] Emitted 'toggleCandidate' for: ${n}.`);
}
</script>

<style scoped>
.candidate-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  border: 1px solid #ccc;
  box-sizing: border-box;
  position: relative; /* 子要素の絶対位置の基準となる */
}

/* 各数字のラッパーdiv */
.candidate-grid > div { /* 直接の子要素のdiv */
  display: flex; /* div内でspanを中央に配置するため */
  align-items: center;
  justify-content: center;
  width: 100%; /* 各グリッドセル内でのサイズ */
  height: 100%;
  position: relative; /* spanのabsolute位置の基準 */
  cursor: pointer; /* クリック可能なことを示す */
  user-select: none;
}

/* 数字を表示する span 要素のスタイル（これは各divの子要素になる） */
.candidate-grid span {
  /* position: absolute; は不要になるか、あるいは相対位置で調整 */
  /* ここでの position: absolute は親の .candidate-grid > div に対して相対 */
  /* したがって、position: absolute を削除し、親のflexboxで中央配置させる */
  /* width: calc(100% / 3); */ /* 親のdivがすでに3分の1サイズなので不要 */
  /* height: calc(100% / 3); */ /* 親のdivがすでに3分の1サイズなので不要 */
  
  font-size: 0.65rem;
  color: #333;
  font-weight: bold;
  line-height: 1; /* 1行表示 */
  /* transform: translate(-50%, -50%); */ /* 必要なら追加 */
  /* top: 50%; left: 50%; */ /* 必要なら追加 */
}

/* 旧pos-Nクラスは削除 */
/* .candidate-grid span.pos-1 { ... } */
/* 理由：各divがすでに3x3のグリッドセルを占めているため、その中のspanは中央に配置するだけで良い。
        個別の位置指定は不要になる。*/

.candidate-grid > div:hover { /* ホバー時の背景色を各divに適用 */
  background-color: #f0f0f0;
}
</style>