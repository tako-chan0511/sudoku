<template>
  <div class="number-picker">
    <!-- クリア用ボタン -->
    <button
      class="clear-btn"
      @click="onPick(0)"
      title="セルを消去"
    >
      ×
    </button>

    <!-- 1〜9 の数字ボタン -->
    <button
      v-for="n in numbers"
      :key="n"
      class="num-btn"
      :disabled="counts[n] >= 9"
      @click="onPick(n)"
      :title="counts[n] >= 9
        ? `数字 ${n} は既に 9 回使われているので入力不可`
        : `数字 ${n} を入力（残り ${9 - counts[n]} 枚）`"
    >
      {{ n }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, computed } from "vue";
import type { Cell } from "@/types/sudoku";

const props = defineProps<{
  flatCells: Cell[];
}>();

const emit = defineEmits<{
  (e: "pick", val: number): void;
}>();

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const counts = computed(() => {
  const cnt: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) cnt[i] = 0;
  for (const cell of props.flatCells) {
    if (cell.value >= 1 && cell.value <= 9) cnt[cell.value]++;
  }
  return cnt;
});

function onPick(n: number) {
  emit("pick", n);
}
</script>

<style scoped>
.number-picker {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 12px 0;
}

.number-picker button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: #f0f0f0;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.1s, background-color 0.2s;
}

.clear-btn {
  background-color: #ff6b6b;
  color: white;
}
.clear-btn:hover {
  background-color: #fa5252;
}

.num-btn:hover:not(:disabled) {
  background-color: #e0e0e0;
  transform: scale(1.1);
}

.num-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
