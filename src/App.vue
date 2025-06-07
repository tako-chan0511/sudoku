<template>
  <div id="app">
    <h1>数独 (Sudoku)</h1>

    <div class="toggle-buttons">
      <label>
        <input type="checkbox" v-model="manualCandidateMode" />
        手動候補モード
      </label>
    </div>

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

    <NumberPicker @pick="onNumberPicked" />
    <div
      class="selected-display"
      :class="{ highlight: manualCandidateMode }"
      @click="!manualCandidateMode && clearSelection()"
    >
      選択中の数字: <strong>{{ selectedNumber === 0 ? '-' : selectedNumber }}</strong>
      <button @click.stop="clearSelection()" class="clear-btn">×</button>
    </div>

    <div v-if="errorMessage" class="validation-msg">{{ errorMessage }}</div>

    <div class="init-buttons">
      <button @click="startGame" class="start-btn">ゲーム開始</button>
      <button @click="clearPuzzle" style="margin-left:8px;">空盤面</button>
      <button @click="resetAll" style="margin-left:8px;">リセット</button>
    </div>

    <div v-if="allCorrect" class="congrats">Congratulations！！！</div>
    <div v-else-if="allFilled" class="error-msg">間違いがあります。確認してください。</div>

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
type SudokuValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 数独のセル値の型

// UI 状態
const manualCandidateMode = ref(false)
const selectedNumber = ref(0)
const currentDifficulty = ref<Difficulty>('easy')
const errorMessage = ref('')

// ゲーム開始時のパズルを保持
// 型をより厳密に指定
let gamePuzzle: SudokuValue[][] = Array.from({ length: 9 }, () => Array(9).fill(0) as SudokuValue[])

// Sudoku API インスタンス
// gamePuzzle の型をアサーションで明示
let { board, flatCells, setCellValue, toggleUserCandidate, resetBoard, updateAllCandidates } = useSudoku(gamePuzzle as SudokuValue[][])

// 難易度設定
function setDifficulty(diff: Difficulty) {
  errorMessage.value = ''
  currentDifficulty.value = diff
}

// ゲーム開始: 動的生成パズルを利用
function startGame() {
  errorMessage.value = ''
  gamePuzzle = makePuzzleByDifficulty(currentDifficulty.value) as SudokuValue[][] // makePuzzleByDifficultyの戻り値も型アサーション
  const api = useSudoku(gamePuzzle)
  board.value = api.board.value
  // flatCells.value = api.flatCells.value // read-onlyなので削除
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
  gamePuzzle = Array.from({ length: 9 }, () => Array(9).fill(0) as SudokuValue[])
  const api = useSudoku(gamePuzzle)
  board.value = api.board.value
  // flatCells.value = api.flatCells.value // read-onlyなので削除
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
  // 現在の gamePuzzle (startGame で設定されたもの) を使って新しい useSudoku インスタンスを作成
  const api = useSudoku(gamePuzzle as SudokuValue[][]) // 型アサーション
  board.value = api.board.value
  // flatCells.value = api.flatCells.value // read-onlyなので削除
  setCellValue = api.setCellValue
  toggleUserCandidate = api.toggleUserCandidate
  resetBoard = api.resetBoard // resetBoard 関数自体も新しいインスタンスのものに更新
  updateAllCandidates = api.updateAllCandidates
  updateAllCandidates() // 新しい盤面で候補を更新
  selectedNumber.value = 0
}

// 数字選択
function onNumberPicked(n: number) {
  errorMessage.value = ''
  selectedNumber.value = n
  console.log(`[App.vue] NumberPicker picked: ${n}, selectedNumber is now: ${selectedNumber.value}`);
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
  console.log(`[App.vue] isConflict: row=${row}, col=${col}, val=${val}`);
  console.log('[App.vue] board (isConflict internal):', JSON.parse(JSON.stringify(board.value.map(r => r.map(c => c.value))))); // Cellオブジェクトからvalueのみをログに出力

  // 行チェック
  for (let c = 0; c < 9; c++) {
    if (c !== col && board.value[row][c].value === val) { // ★.value を追加
      console.log(`[App.vue] ★★★ 行重複検知: (${row},${c}) に ${val} があります`);
      return true
    }
  }
  // 列チェック
  for (let r = 0; r < 9; r++) {
    if (r !== row && board.value[r][col].value === val) { // ★.value を追加
      console.log(`[App.vue] ★★★ 列重複検知: (${r},${col}) に ${val} があります`);
      return true
    }
  }
  // ブロックチェック
  const br = Math.floor(row/3)*3, bc = Math.floor(col/3)*3
  for (let r_block = br; r_block < br+3; r_block++) {
    for (let c_block = bc; c_block < bc+3; c_block++) {
      if (!(r_block === row && c_block === col) && board.value[r_block][c_block].value === val) { // ★.value を追加
        console.log(`[App.vue] ★★★ ブロック重複検知: (${r_block},${c_block}) に ${val} があります`);
        return true
      }
    }
  }
  return false
}

// セル確定時処理
// ★引数の型を SudokuCell がemitするペイロード { row: number; col: number; val: number } に修正
function onSelectCell(payload: { row: number; col: number; val: number }) {
  const { row, col, val } = payload; // ペイロードから値を取り出す
  console.log(`[App.vue] onSelectCell received: row=${row}, col=${col}, val=${val}`); // 追加ログ

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
  setCellValue(row, col, val as SudokuValue) // setCellValue の引数型に合わせる
  updateAllCandidates()
}

// 候補トグル
function onToggleCandidate(payload: { row: number; col: number; candidate: number }) {
  const { row, col, candidate } = payload;
  toggleUserCandidate(row, col, candidate as 1|2|3|4|5|6|7|8|9)
}

// 完成判定
const allFilled = computed(() => flatCells.value.every(c => c.value !== 0))
const allCorrect = computed(() => {
  if (!allFilled.value) return false
  const g = board.value
  const isValidGroup = (nums: number[]) => new Set(nums).size === 9 && nums.every(n => n >= 1 && n <= 9)
  // 行・列
  for (let i = 0; i < 9; i++) {
    if (
      !isValidGroup(g[i].map(cell => cell.value)) || // ★.map(cell => cell.value) を追加
      !isValidGroup(g.map(r => r[i].value)) // ★.map(r => r[i].value) を追加
    ) return false
  }
  // ブロック
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const block: number[] = []
      for (let r_block = br*3; r_block < br*3+3; r_block++) {
        for (let c_block = bc*3; c_block < bc*3+3; c_block++) {
          block.push(g[r_block][c_block].value) // ★.value を追加
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