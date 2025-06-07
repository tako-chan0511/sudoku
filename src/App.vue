<template>
  <div id="app">
    <h1>数独 (Sudoku)</h1>

    <!-- 手動候補モード切替 -->
    <div class="toggle-buttons">
      <label>
        <input type="checkbox" v-model="manualCandidateMode" />
        手動候補モード
      </label>
    </div>

    <!-- 難易度選択ボタン -->
    <div class="difficulty-buttons">
      <button
        :class="{ active: currentDifficulty === 'easy' }"
        @click="setDifficulty('easy')"
      >
        Easy
      </button>
      <button
        :class="{ active: currentDifficulty === 'medium' }"
        @click="setDifficulty('medium')"
      >
        Medium
      </button>
      <button
        :class="{ active: currentDifficulty === 'hard' }"
        @click="setDifficulty('hard')"
      >
        Hard
      </button>
    </div>

    <!-- 数字入力パネル -->
    <NumberPicker @pick="onNumberPicked" />
    <div
      class="selected-display"
      :class="{ highlight: manualCandidateMode }"
      @click="manualCandidateMode ? null : clearSelection"
    >
      選択中の数字:
      <strong>{{ selectedNumber === 0 ? '-' : selectedNumber }}</strong>
      <button @click.stop="clearSelection" class="clear-btn">×</button>
    </div>

    <!-- ゲーム開始・リセットボタン -->
    <div class="init-buttons">
      <button @click="startGame" class="start-btn">ゲーム開始</button>
      <button @click="clearPuzzle" style="margin-left: 8px;">空盤面</button>
      <button @click="resetAll" style="margin-left: 8px;">リセット</button>
    </div>

    <!-- 完成時メッセージ -->
    <div v-if="allFilled" class="congrats">Congradylations！！！</div>

    <!-- 9×9 ボードを表示 -->
    <div class="board-wrapper">
      <SudokuCell
        v-for="cell in flatCells"
        :key="`${cell.row}-${cell.col}`"
        :cell="cell"
        :showCandidates="manualCandidateMode"
        :useUserCandidates="manualCandidateMode"
        :selectedNumber="selectedNumber"
        @selectCell="onSelectCell"
        @toggleCandidate="onToggleCandidate"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue"
import type { Cell } from "@/types/sudoku"
import { useSudoku } from "@/composables/useSudoku"
import SudokuCell from "@/components/SudokuCell.vue"
import NumberPicker from "@/components/NumberPicker.vue"

// 簡単 (Easy) パズル例
const samplePuzzleEasy: (0|1|2|3|4|5|6|7|8|9)[][] = [
  [0,0,3, 0,2,0, 6,0,0],
  [9,0,0, 3,0,5, 0,0,1],
  [0,0,1, 8,0,6, 4,0,0],
  [0,0,8, 1,0,2, 9,0,0],
  [7,0,0, 0,0,0, 0,0,8],
  [0,0,6, 7,0,8, 2,0,0],
  [0,0,2, 6,0,9, 5,0,0],
  [8,0,0, 2,0,3, 0,0,9],
  [0,0,5, 0,1,0, 3,0,0],
]

// 中級 (Medium) パズル例
const samplePuzzleMedium: (0|1|2|3|4|5|6|7|8|9)[][] = [
  [0,2,0, 6,0,8, 0,0,0],
  [5,8,0, 0,1,9, 7,0,0],
  [0,0,0, 0,0,0, 0,3,0],
  [0,0,1, 0,0,0, 0,6,8],
  [0,0,8, 5,0,2, 4,0,0],
  [7,6,0, 0,0,0, 1,0,0],
  [0,3,0, 0,0,0, 0,0,0],
  [0,0,7, 8,2,0, 0,5,4],
  [0,0,0, 9,0,3, 0,2,0],
]

// 上級 (Hard) パズル例
const samplePuzzleHard: (0|1|2|3|4|5|6|7|8|9)[][] = [
  [0,0,0, 0,0,0, 0,0,0],
  [0,0,0, 0,0,3, 0,8,5],
  [0,0,1, 0,2,0, 0,0,0],
  [0,0,0, 5,0,7, 0,0,0],
  [0,0,4, 0,0,0, 1,0,0],
  [0,9,0, 0,0,0, 0,0,0],
  [5,0,0, 0,0,0, 0,7,3],
  [0,6,0, 0,0,0, 0,0,0],
  [0,0,0, 0,4,0, 0,0,9],
]

// 難易度ごとのパズルマップ
const puzzlesByDifficulty = {
  easy: [samplePuzzleEasy],
  medium: [samplePuzzleMedium],
  hard: [samplePuzzleHard],
}

// 手動候補モード
const manualCandidateMode = ref(false)
// ユーザ選択数字
const selectedNumber = ref(0)
// 現在の難易度
const currentDifficulty = ref<keyof typeof puzzlesByDifficulty>('easy')

// useSudoku インスタンス
let { board, flatCells, setCellValue, toggleUserCandidate, resetBoard, updateAllCandidates } = useSudoku()

/** 難易度設定のみ */
function setDifficulty(diff: keyof typeof puzzlesByDifficulty) {
  currentDifficulty.value = diff
}

/** ゲーム開始: 指定難易度でランダム出題 */
function startGame() {
  const list = puzzlesByDifficulty[currentDifficulty.value]
  const puzzle = list[Math.floor(Math.random() * list.length)]
  const api = useSudoku(puzzle)
  board.value = api.board.value
  flatCells.value = api.flatCells.value
  setCellValue = api.setCellValue
  toggleUserCandidate = api.toggleUserCandidate
  resetBoard = api.resetBoard
  updateAllCandidates = api.updateAllCandidates
  updateAllCandidates()
  selectedNumber.value = 0
}

/** 空盤面生成 */
function clearPuzzle() {
  const api = useSudoku()
  board.value = api.board.value
  flatCells.value = api.flatCells.value
  setCellValue = api.setCellValue
  toggleUserCandidate = api.toggleUserCandidate
  resetBoard = api.resetBoard
  updateAllCandidates = api.updateAllCandidates
  updateAllCandidates()
  selectedNumber.value = 0
}

/** 全リセット */
function resetAll() {
  resetBoard()
  updateAllCandidates()
  selectedNumber.value = 0
}

/** 数字選択 */
function onNumberPicked(n: number) {
  selectedNumber.value = n
}
function clearSelection() {
  selectedNumber.value = 0
}

/** セルクリック */
function onSelectCell({ row, col, val }: { row: number; col: number; val: number }) {
  setCellValue(row, col, val as any)
  updateAllCandidates()
}

/** 候補トグル */
function onToggleCandidate({ row, col, candidate }: { row: number; col: number; candidate: number }) {
  toggleUserCandidate(row, col, candidate as any)
}

// 完成判定
const allFilled = computed(() => flatCells.value.every(cell => cell.value !== 0))
</script>

<style>
#app { max-width: 600px; margin: 0 auto; padding: 16px; text-align: center; font-family: Arial, sans-serif; }
.toggle-buttons, .difficulty-buttons, .init-buttons { margin-bottom: 12px; }
.difficulty-buttons button { margin-right: 8px; padding: 6px 12px; }
.difficulty-buttons button.active { background-color: #007ACC; color: #fff; }
.selected-display { margin: 8px 0; padding: 4px; }
.selected-display.highlight { background-color: #e0f2e9; }
.clear-btn { padding: 1px 4px; font-size: 0.9rem; margin-left: 8px; }
.board-wrapper { display: grid; grid-template-columns: repeat(9, 48px); grid-template-rows: repeat(9, 48px); border: 2px solid #007ACC; margin: 0 auto; }
.congrats { margin: 12px 0; font-size: 1.2rem; color: green; font-weight: bold; }
.start-btn { background-color: #007ACC; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; }
.start-btn:hover { background-color: #005A9C; }
</style>
