<template>
  <div id="app" @keydown="handleKeyDown" tabindex="0">
    <h1>数独 (Sudoku)</h1>

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
    <div class="init-buttons">
      <button @click="startGame" class="start-btn">ゲーム開始</button>
      <button @click="clearPuzzle" style="margin-left: 8px">空盤面</button>
      <button @click="resetAll" style="margin-left: 8px">リセット</button>
    </div>
    <div class="input-mode-buttons">
      <button
        :class="{ active: inputMode === 'thinking' }"
        @click="toggleInputMode"
      >
        候補入力モード
      </button>
    </div>
    <NumberPicker @pick="onNumberPicked" />
    <div v-if="errorMessage" class="validation-msg">{{ errorMessage }}</div>

    <div v-if="allCorrect" class="congrats">Congratulations！！！</div>
    <div v-else-if="allFilled" class="error-msg">
      間違いがあります。確認してください。
    </div>

    <div class="board-wrapper">
      <SudokuCell
        v-for="cell in flatCells"
        :key="`${cell.row}-${cell.col}`"
        :cell="cell"
        :inputMode="inputMode"
        :selectedNumber="selectedNumber"
        :isSelected="
          selectedCell
            ? selectedCell.row === cell.row && selectedCell.col === cell.col
            : false
        "
        @selectCell="onSelectCellFromBoard"
        @inputCell="onInputCell"
        @toggleCandidate="onToggleCandidate"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import type { Cell } from "@/types/sudoku";
import { useSudoku } from "@/composables/useSudoku";
import SudokuCell from "@/components/SudokuCell.vue";
import NumberPicker from "@/components/NumberPicker.vue";
import { makePuzzleByDifficulty } from "@/utils/puzzleGenerator";
import { nextTick, onMounted } from "vue";

// 型
type Difficulty = "easy" | "medium" | "hard";
type SudokuValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type InputMode = "confirm" | "thinking";

// UI 状態
const inputMode = ref<InputMode>("confirm"); // ★変更点2: 初期値を 'confirm' に設定 (候補入力OFF)
const selectedNumber = ref(0);
const currentDifficulty = ref<Difficulty>("easy");
const errorMessage = ref("");
const selectedCell = ref<Cell | null>(null);

// ゲーム開始時のパズルを保持
let gamePuzzle: SudokuValue[][] = Array.from(
  { length: 9 },
  () => Array(9).fill(0) as SudokuValue[]
);

// Sudoku API インスタンス
let {
  board,
  flatCells,
  setCellValue,
  toggleUserCandidate,
  resetBoard,
  updateAllCandidates,
} = useSudoku(gamePuzzle as SudokuValue[][]);

onMounted(() => {
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.focus();
  }

  nextTick(() => {
    if (flatCells.value.length > 0) {
      selectedCell.value = flatCells.value[0];
      console.log(`[App.vue] onMounted: Initial cell selected: (${selectedCell.value.row}, ${selectedCell.value.col})`);
    }
  });
});

// ★変更点3: キーボードイベントハンドラ
function handleKeyDown(event: KeyboardEvent) {
  if (!selectedCell.value) {
    return; // セルが選択されていない場合は何もしない
  }

  let newRow = selectedCell.value.row;
  let newCol = selectedCell.value.col;
  let moved = false;

  switch (event.key) {
    case 'ArrowUp':
      newRow = Math.max(0, newRow - 1);
      moved = true;
      break;
    case 'ArrowDown':
      newRow = Math.min(8, newRow + 1);
      moved = true;
      break;
    case 'ArrowLeft':
      newCol = Math.max(0, newCol - 1);
      moved = true;
      break;
    case 'ArrowRight':
      newCol = Math.min(8, newCol + 1);
      moved = true;
      break;
    case 'Backspace':
    case 'Delete':
      if (!selectedCell.value.isGiven && selectedCell.value.value !== 0) {
        onInputCell({ row: newRow, col: newCol, val: 0 });
        event.preventDefault();
      } else if (!selectedCell.value.isGiven && selectedCell.value.userCandidates.size > 0 && inputMode.value === 'thinking') {
         selectedCell.value.userCandidates.forEach(cand => {
            toggleUserCandidate(newRow, newCol, cand as 1|2|3|4|5|6|7|8|9);
         });
         event.preventDefault();
      }
      return;
    case '1': case '2': case '3': case '4': case '5':
    case '6': case '7': case '8': case '9':
      onNumberPicked(parseInt(event.key));
      event.preventDefault();
      return;
  }

  if (moved) {
    selectedCell.value = board.value[newRow][newCol];
    event.preventDefault();
    console.log(`[App.vue] handleKeyDown: Moved to (${newRow}, ${newCol})`);
  }
}

// ★変更点4: inputModeをトグルする関数を追加
function toggleInputMode() {
  inputMode.value = inputMode.value === 'confirm' ? 'thinking' : 'confirm';
  errorMessage.value = "";
  console.log(`[App.vue] Input mode toggled to: ${inputMode.value}`);
}

// 既存の setInputMode はもうボタンからは呼ばれていませんが、
// 他の場所で使われていないことを確認できたら削除してOKです。
// 現時点では、念のため残しておきます。
function setInputMode(mode: InputMode) {
  console.log(`[App.vue] Setting input mode to: ${mode}`);
  inputMode.value = mode;
  errorMessage.value = "";
}

// 難易度設定
function setDifficulty(diff: Difficulty) {
  console.log(`[App.vue] Setting difficulty to: ${diff}`);
  errorMessage.value = "";
  currentDifficulty.value = diff;
}

// ゲーム開始: 動的生成パズルを利用
function startGame() {
  console.log("[App.vue] Starting new game...");
  errorMessage.value = "";
  gamePuzzle = makePuzzleByDifficulty(
    currentDifficulty.value
  ) as SudokuValue[][];
  const api = useSudoku(gamePuzzle);
  board.value = api.board.value;
  setCellValue = api.setCellValue;
  toggleUserCandidate = api.toggleUserCandidate;
  resetBoard = api.resetBoard;
  updateAllCandidates = api.updateAllCandidates;
  updateAllCandidates();
  selectedNumber.value = 0;
  nextTick(() => {
    selectedCell.value = flatCells.value[0];
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.focus();
    }
  });
}

// 空盤面生成
function clearPuzzle() {
  console.log("[App.vue] Clearing puzzle...");
  errorMessage.value = "";
  gamePuzzle = Array.from(
    { length: 9 },
    () => Array(9).fill(0) as SudokuValue[]
  );
  const api = useSudoku(gamePuzzle);
  board.value = api.board.value;
  setCellValue = api.setCellValue;
  toggleUserCandidate = api.toggleUserCandidate;
  resetBoard = api.resetBoard;
  updateAllCandidates = api.updateAllCandidates;
  updateAllCandidates();
  selectedNumber.value = 0;
  nextTick(() => {
    selectedCell.value = flatCells.value[0];
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.focus();
    }
  });
}

// リセット: 開始時のパズル状態に戻す
function resetAll() {
  console.log("[App.vue] Resetting all...");
  errorMessage.value = "";
  const api = useSudoku(gamePuzzle as SudokuValue[][]);
  board.value = api.board.value;
  setCellValue = api.setCellValue;
  toggleUserCandidate = api.toggleUserCandidate;
  resetBoard = api.resetBoard;
  updateAllCandidates = api.updateAllCandidates;
  updateAllCandidates();
  selectedNumber.value = 0;
  nextTick(() => {
    selectedCell.value = flatCells.value[0];
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.focus();
    }
  });
}

// 数字選択 (NumberPickerから)
function onNumberPicked(n: number) {
  errorMessage.value = "";
  selectedNumber.value = n;
  console.log(
    `[App.vue] NumberPicker picked: ${n}, selectedNumber is now: ${selectedNumber.value}. Current mode: ${inputMode.value}`
  );

  if (selectedCell.value) {
    console.log(
      `[App.vue] onNumberPicked: Cell (${selectedCell.value.row}, ${selectedCell.value.col}) selected. Its value: ${selectedCell.value.value}, isGiven: ${selectedCell.value.isGiven}`
    );

    if (selectedCell.value.isGiven) {
      console.log(
        `[App.vue] onNumberPicked: Cell (${selectedCell.value.row},${selectedCell.value.col}) is given, cannot modify.`
      );
      errorMessage.value = `問題の数字は変更できません`;
      return;
    }

    onInputCell({
      row: selectedCell.value.row,
      col: selectedCell.value.col,
      val: selectedNumber.value,
    });
  } else {
    console.log(`[App.vue] onNumberPicked: No cell selected.`);
    errorMessage.value = `先にセルを選択してください。`;
  }
}

// 選択解除 (selectedNumberを0に)
function clearSelection() {
  console.log("[App.vue] clearSelection called.");
  errorMessage.value = "";
  selectedNumber.value = 0;
  selectedCell.value = null;
}

// SudokuCellからのセル選択イベント
function onSelectCellFromBoard(cell: Cell) {
  console.log(
    `[App.vue] onSelectCellFromBoard: Cell (${cell.row}, ${cell.col}) clicked.`
  );
  errorMessage.value = "";
  if (
    selectedCell.value &&
    selectedCell.value.row === cell.row &&
    selectedCell.value.col === cell.col
  ) {
    selectedCell.value = null;
    console.log(
      `[App.vue] onSelectCellFromBoard: Cell (${cell.row}, ${cell.col}) deselected.`
    );
  } else {
    selectedCell.value = cell;
    console.log(
      `[App.vue] onSelectCellFromBoard: Cell (${cell.row}, ${cell.col}) selected.`
    );
  }
  nextTick(() => {
    console.log(`[App.vue] onSelectCellFromBoard: nextTick executed.`);
  });
}

// 重複チェック (ログ付き)
function isConflict(row: number, col: number, val: number): boolean {
  console.log(`[App.vue] isConflict: row=${row}, col=${col}, val=${val}`);
  console.log(
    "[App.vue] board (isConflict internal):",
    JSON.parse(JSON.stringify(board.value.map((r) => r.map((c) => c.value))))
  );

  for (let c = 0; c < 9; c++) {
    if (c !== col && board.value[row][c].value === val) {
      console.log(
        `[App.vue] ★★★ 行重複検知: (${row},${c}) に ${val} があります`
      );
      return true;
    }
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board.value[r][col].value === val) {
      console.log(
        `[App.vue] ★★★ 列重複検知: (${r},${col}) に ${val} があります`
      );
      return true;
    }
  }
  const br = Math.floor(row / 3) * 3,
    bc = Math.floor(col / 3) * 3;
  for (let r_block = br; r_block < br + 3; r_block++) {
    for (let c_block = bc; c_block < bc + 3; c_block++) {
      if (
        !(r_block === row && c_block === col) &&
        board.value[r_block][c_block].value === val
      ) {
        console.log(
          `[App.vue] ★★★ ブロック重複検知: (${r_block},${c_block}) に ${val} があります`
        );
        return true;
      }
    }
  }
  return false;
}

// セルへの入力統合ハンドラ
function onInputCell(payload: { row: number; col: number; val: number }) {
  const { row, col, val } = payload;
  console.log(
    `[App.vue] onInputCell received: row=${row}, col=${col}, val=${val}, inputMode=${inputMode.value}`
  );

  if (!selectedCell.value) {
    console.warn(`[App.vue] onInputCell: No cell selected.`);
    errorMessage.value = `先にセルを選択してください。`;
    return;
  }

  if (selectedCell.value.isGiven) {
    console.warn(`[App.vue] onInputCell: Cell (${row},${col}) is given.`);
    errorMessage.value = `問題の数字は変更できません`;
    return;
  }

  errorMessage.value = "";

  if (val === 0) {
    console.log(`[App.vue] onInputCell: Clear operation for (${row},${col}).`);
    setCellValue(row, col, 0);
    updateAllCandidates();
    return;
  }

  if (inputMode.value === "confirm") {
    console.log(
      `[App.vue] onInputCell: Confirm mode, setting value ${val} to (${row},${col}).`
    );
    if (isConflict(row, col, val)) {
      errorMessage.value = `重複: (${row + 1},${
        col + 1
      }) に ${val} は置けません`;
      return;
    }
    setCellValue(row, col, val as SudokuValue);
    updateAllCandidates();
  } else {
    console.log(
      `[App.vue] onInputCell: Thinking mode, toggling candidate ${val} for (${row},${col}).`
    );
    toggleUserCandidate(row, col, val as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9);
  }
}

// 候補トグル (SudokuCellのCandidateGridからの直接イベント)
function onToggleCandidate(payload: {
  row: number;
  col: number;
  candidate: number;
}) {
  const { row, col, candidate } = payload;
  console.log(
    `[App.vue] onToggleCandidate received: row=${row}, col=${col}, candidate=${candidate}.`
  );

  if (!selectedCell.value || selectedCell.value.isGiven) {
    console.warn(
      `[App.vue] onToggleCandidate: No cell selected or cell is given.`
    );
    return;
  }

  toggleUserCandidate(row, col, candidate as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9);
}

// 完成判定
const allFilled = computed(() => flatCells.value.every((c) => c.value !== 0));
const allCorrect = computed(() => {
  if (!allFilled.value) return false;
  const g = board.value;
  const isValidGroup = (nums: number[]) =>
    new Set(nums).size === 9 && nums.every((n) => n >= 1 && n <= 9);
  for (let i = 0; i < 9; i++) {
    if (
      !isValidGroup(g[i].map((cell) => cell.value)) ||
      !isValidGroup(g.map((r) => r[i].value))
    )
      return false;
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const block: number[] = [];
      for (let r_block = br * 3; r_block < br * 3 + 3; r_block++) {
        for (let c_block = bc * 3; c_block < bc * 3 + 3; c_block++) {
          block.push(g[r_block][c_block].value);
        }
      }
      if (!isValidGroup(block)) return false;
    }
  }
  return true;
});
</script>

<style>
#app {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  text-align: center;
  font-family: Arial, sans-serif;
}

.input-mode-buttons {
  margin-bottom: 12px;
}
.input-mode-buttons button {
  padding: 6px 12px;
  margin-right: 8px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}
.input-mode-buttons button.active {
  background-color: #007acc;
  color: #fff;
  border-color: #007acc;
}

.difficulty-buttons,
.init-buttons {
  margin-bottom: 12px;
}
.difficulty-buttons button {
  margin-right: 8px;
  padding: 6px 12px;
}
.difficulty-buttons button.active {
  background-color: #007acc;
  color: #fff;
}
.validation-msg {
  color: red;
  margin: 8px 0;
}

.board-wrapper {
  display: grid;
  grid-template-columns: repeat(9, 48px);
  grid-template-rows: repeat(9, 48px);
  border: 2px solid #007acc;
  margin: 0 auto;
}
.congrats {
  margin: 12px 0;
  font-size: 1.2rem;
  color: green;
  font-weight: bold;
}
.error-msg {
  margin: 12px 0;
  font-size: 1rem;
  color: red;
}
.start-btn {
  background-color: #007acc;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.start-btn:hover {
  background-color: #005a9c;
}
</style>