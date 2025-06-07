<template>
  <div class="candidate-grid">
    <div
      v-for="n in 9"
      :key="n"
      class="small-cell"
      :class="{ filled: isFilled(n), number: shouldShowNumber(n) }"
      @click.stop="onSmallCellClick(n)"
    >
      <!-- 
        ・isInvalid(n) === true → 黒塗り
        ・isHidden(n)  === true → 何も表示せず（白いまま）
        ・それ以外 → 数字を小さく表示
      -->
      <span v-if="shouldShowNumber(n)">{{ n }}</span>
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

// n を「黒塗り」（候補あり）にするか
function isFilled(n: number): boolean {
  // 手動候補モードのときは userCandidates[n] === true → 黒塗り
  // 補助（自動）候補モード時は autoCandidates[n] === true → 黒塗り
  return props.useUserCandidates
    ? props.userCandidates[n as 1]
    : props.autoCandidates[n as 1];
}

// 数字表示するか
function shouldShowNumber(n: number): boolean {
  // 黒塗り（候補あり）では数字は表示しない
  return !isFilled(n) && (
    props.useUserCandidates
      ? !props.userCandidates[n as 1]
      : !props.autoCandidates[n as 1]
  );
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
  /* 候補グリッド全体を点線で表示 */
  border: 1px dotted #666;
  box-sizing: border-box;
}
.small-cell {
  /* 各小セルにも点線枠を追加 */
  border: 1px dotted #666;
  box-sizing: border-box;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.small-cell.filled {
  background-color: #000;
}
.small-cell.number span {
  /* 数字を小さく表示 */
  color: #333;
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
</style>
