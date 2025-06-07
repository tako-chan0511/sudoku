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
      >Easy</button>
      <button
        :class="{ active: currentDifficulty === 'medium' }"
        @click="setDifficulty('medium')"
      >Medium</button>
      <button
        :class="{ active: currentDifficulty === 'hard' }"
        @click="setDifficulty('hard')"
      >Hard</button>
    </div>

    <!-- 数字入力パネル -->
    <NumberPicker @pick="onNumberPicked" />
    <div
      class="selected-display"
      :class="{ highlight: manualCandidateMode }"
      @click="!manualCandidateMode && clearSelection()"
    >
      選択中の数字: <strong>{{ selectedNumber === 0 ? '-' : selectedNumber }}</strong>
      <button @click.stop="clearSelection()" class="clear-btn">×</button>
    </div>

    <!-- 入力エラー表示 -->
    <div v-if="errorMessage" class="validation-msg">{{ errorMessage }}</div>

    <!-- ゲーム開始・リセットボタン -->
    <div class="init-buttons">
      <button @click="startGame" class="start-btn">ゲーム開始</button>
      <button @click="clearPuzzle" style="margin-left:8px;">空盤面</button>
      <button @click="resetAll" style="margin-left:8px;">リセット</button>
    </div>

    <!-- 完成時メッセージ -->
    <div v-if="allCorrect" class="congrats">Congratulations！！！</div>
    <div v-else-if="allFilled" class="error-msg">間違いがあります。確認してください。</div>

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
import { ref, computed } from 'vue'
import type { Cell } from '@/types/sudoku'
import { useSudoku } from '@/composables/useSudoku'
import SudokuCell from '@/components/SudokuCell.vue'
import NumberPicker from '@/components/NumberPicker.vue'
import { makePuzzleByDifficulty } from '@/utils/puzzleGenerator'

// 型
type Difficulty = 'easy' | 'medium' | 'hard'

// UI 状態
const manualCandidateMode = ref(false)
const selectedNumber = ref(0)
const currentDifficulty = ref<Difficulty>('easy')
const errorMessage = ref('')

// ゲーム開始時のパズルを保持
let gamePuzzle: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0))

// Sudoku API インスタンス
let { board, flatCells, setCellValue, toggleUserCandidate, resetBoard, updateAllCandidates } = useSudoku(gamePuzzle)

// 難易度設定
function setDifficulty(diff: Difficulty) {
  errorMessage.value = ''
  currentDifficulty.value = diff
}

// ゲーム開始: 動的生成パズルを利用
function startGame() {
  errorMessage.value = ''
  gamePuzzle = makePuzzleByDifficulty(currentDifficulty.value)
  const api = useSudoku(gamePuzzle)
  board.value = api.board.value
  flatCells.value = api.flatCells.value
  setCellValue = api.setCellValue
  toggleUserCandidate = api.toggleUserCandidate
  resetBoard = api.resetBoard
  updateAllCandidates = api.updateAllCandidates
  updateAllCandidates()
  selectedNumber.value = 0
}

// 空盤面生成
function clearPuzzle() {
  errorMessage.value = ''
  gamePuzzle = Array.from({ length: 9 }, () => Array(9).fill(0))
  const api = useSudoku(gamePuzzle)
  board.value = api.board.value
  flatCells.value = api.flatCells.value
  setCellValue = api.setCellValue
  toggleUserCandidate = api.toggleUserCandidate
  resetBoard = api.resetBoard
  updateAllCandidates = api.updateAllCandidates
  updateAllCandidates()
  selectedNumber.value = 0
}

// リセット: 開始時のパズル状態に戻す
function resetAll() {
  errorMessage.value = ''
  // ★★★ この部分を変更します ★★★
  // 現在の gamePuzzle (startGame で設定されたもの) を使って新しい useSudoku インスタンスを作成
  const api = useSudoku(gamePuzzle)
  board.value = api.board.value
  flatCells.value = api.flatCells.value // flatCells も更新する
  setCellValue = api.setCellValue
  toggleUserCandidate = api.toggleUserCandidate
  resetBoard = api.resetBoard // resetBoard 関数自体も新しいインスタンスのものに更新
  updateAllCandidates = api.updateAllCandidates
  // ★★★ 変更ここまで ★★★

  updateAllCandidates() // 新しい盤面で候補を更新
  selectedNumber.value = 0
}

// 数字選択
function onNumberPicked(n: number) {
  errorMessage.value = ''
  selectedNumber.value = n
}

// 選択解除
function clearSelection() {
  if (!manualCandidateMode.value) {
    errorMessage.value = ''
    selectedNumber.value = 0
  }
}

// 重複チェック (ログ付き)
function isConflict(row: number, col: number, val: number): boolean {
  console.log(`isConflict: row=${row}, col=${col}, val=${val}`)
  console.log('board:', JSON.parse(JSON.stringify(board.value)))
  // 行チェック
  for (let c = 0; c < 9; c++) {
    if (c !== col && board.value[row][c] === val) return true
  }
  // 列チェック
  for (let r = 0; r < 9; r++) {
    if (r !== row && board.value[r][col] === val) return true
  }
  // ブロックチェック
  const br = Math.floor(row/3)*3, bc = Math.floor(col/3)*3
  for (let r = br; r < br+3; r++) {
    for (let c = bc; c < bc+3; c++) {
      if (!(r===row && c===col) && board.value[r][c] === val) return true
    }
  }
  return false
}

// セル確定時
function onSelectCell({ row, col, val }: Cell) {
  errorMessage.value = ''
  if (val === 0) {
    setCellValue(row, col, 0)
    updateAllCandidates()
    return
  }
  if (isConflict(row, col, val)) {
    errorMessage.value = `重複: (${row+1},${col+1}) に ${val} は置けません`
    return
  }
  setCellValue(row, col, val)
  updateAllCandidates()
}

// 候補トグル
function onToggleCandidate({ row, col, candidate }: { row: number; col: number; candidate: number }) {
  toggleUserCandidate(row, col, candidate)
}

// 完成判定
const allFilled = computed(() => flatCells.value.every(c => c.value !== 0))
const allCorrect = computed(() => {
  if (!allFilled.value) return false
  const g = board.value
  const isValidGroup = (nums: number[]) => new Set(nums).size === 9 && nums.every(n => 1 <= n && n <= 9)
  // 行・列
  for (let i = 0; i < 9; i++) {
    if (!isValidGroup(g[i]) || !isValidGroup(g.map(r => r[i]))) return false
  }
  // ブロック
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const block: number[] = []
      for (let r = br*3; r < br*3+3; r++) {
        for (let c = bc*3; c < bc*3+3; c++) {
          block.push(g[r][c])
        }
      }
      if (!isValidGroup(block)) return false
    }
  }
  return true
})
</script>

<style>
#app { max-width: 600px; margin: 0 auto; padding: 16px; text-align: center; font-family: Arial, sans-serif; }
.toggle-buttons, .difficulty-buttons, .init-buttons { margin-bottom: 12px; }
.difficulty-buttons button { margin-right: 8px; padding: 6px 12px; }
.difficulty-buttons button.active { background-color: #007ACC; color: #fff; }
.validation-msg { color: red; margin: 8px 0; }
.selected-display { margin: 8px 0; padding: 4px; }
.selected-display.highlight { background-color: #e0f2e9; }
.clear-btn { padding: 1px 4px; font-size: 0.9rem; margin-left: 8px; }
.board-wrapper { display: grid; grid-template-columns: repeat(9, 48px); grid-template-rows: repeat(9, 48px); border: 2px solid #007ACC; margin: 0 auto; }
.congrats { margin: 12px 0; font-size: 1.2rem; color: green; font-weight: bold; }
.error-msg { margin: 12px 0; font-size: 1rem; color: red; }
.start-btn { background-color: #007ACC; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; }
.start-btn:hover { background-color: #005A9C; }
</style>
