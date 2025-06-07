<!-- src/components/NumberPicker.vue -->
<template>
  <div class="number-picker">
    <button
      v-for="n in 9"
      :key="n"
      @click="$emit('pick', n)"
      class="num-btn"
    >
      {{ n }}
    </button>
    <!-- クリア用に「×」を用意 -->
    <button @click="$emit('pick', 0)" class="num-btn clear">×</button>
  </div>
</template>

<script lang="ts" setup>
const emits = defineEmits<{
  (e: "pick", n: number): void;
}>();
</script>

<style scoped>
.number-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-bottom: 8px;
}
.num-btn {
  width: 32px;
  height: 32px;
  font-size: 1rem;
  cursor: pointer;
}
.clear {
  color: red;
}
</style>
