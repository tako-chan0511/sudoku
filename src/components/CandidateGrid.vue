<!-- src/components/CandidateGrid.vue -->
<template>
  <div class="candidate-grid">
    <div
      v-for="n in 9"
      :key="n"
      class="small-cell"
      :class="{ invalid: isInvalid(n), hidden: isHidden(n) }"
      @click.stop="onSmallCellClick(n)"
    >
      <!-- 
        ・isInvalid(n) === true → 黒塗り
        ・isHidden(n)  === true → 何も表示せず（白いまま）
        ・それ以外 → 数字を小さく表示
      -->
      <span v-if="!isInvalid(n) && !isHidden(n)">{{ n }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Candidates } from "@/types/sudoku";
import { defineProps, defineEmits } from "vue";

interface Props {
  /** 自動候補 or 手動候補を分岐して表示するフラグ */
  useUserCandidates: boolean;
  /** 自動候補値 (useUserCandidates=false の場合はこちらを参照) */
  autoCandidates: Candidates;
  /** 手動候補値 (useUserCandidates=true の場合はこちらを参照) */
  userCandidates: Candidates;
  /** given セルなど編集禁止のときクリックを無効化 */
  isEditable: boolean;
}

const props = defineProps<Props>();

/** 候補トグル時、’toggleCandidate’ イベントを親に通知する */
const emits = defineEmits<{
  (e: "toggleCandidate", n: number): void;
}>();

// n を候補表示で「黒塗り」(invalid) とするか
function isInvalid(n: number): boolean {
  // autoCandidates/userCandidates が false → 黒塗り
  if (props.useUserCandidates) {
    return !props.userCandidates[n as 1];
  } else {
    return !props.autoCandidates[n as 1];
  }
}

// n を候補として「何も表示せず（白抜き）」にするか
// 今回は明示的に「候補オフ」の場合、白抜きにする。黒塗り or 数字表示以外は白抜き
function isHidden(n: number): boolean {
  // すべてのケースで出力するわけではなく、候補 OFF なら白抜き
  return false;
}

// 小セルをクリックしたとき（手動候補モード + 編集可能セル のときのみイベント上げる）
function onSmallCellClick(n: number) {
  if (!props.isEditable) return;
  if (!props.useUserCandidates) return;
  emits("toggleCandidate", n);
}
</script>

<style scoped>
.candidate-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows:    repeat(3, 1fr);
  width: 100%;
  height: 100%;
}
.small-cell {
  border: 1px solid #ccc;
  box-sizing: border-box;
  background-color: #fff;
  position: relative;
}
.small-cell.invalid {
  background-color: #000;
}
.small-cell span {
  display: block;
  text-align: center;
  line-height: 1;
  font-size: 0.55rem;
  color: #333;
  user-select: none;
  margin-top: 2px;
}
.small-cell.hidden {
  background-color: #fff; /* 何も表示せず */
}
</style>
