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
      <button @click="saveCurrentPuzzle" style="margin-left: 8px">盤面保存</button>
      <button @click="showSavedPuzzles = true" style="margin-left: 8px">履歴を見る</button>
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

    <div v-if="showSavedPuzzles" class="modal-overlay">
      <div class="modal-content">
        <h2>保存されたパズル</h2>
        <ul v-if="savedPuzzles.length > 0">
          <li v-for="puzzle in sortedSavedPuzzles" :key="puzzle.id" class="saved-puzzle-item">
            <span>{{ puzzle.name }} ({{ new Date(puzzle.timestamp).toLocaleString() }}) - {{ puzzle.difficulty }}</span>
            <button @click="loadPuzzle(puzzle.id)">ロード</button>
            <button @click="deletePuzzle(puzzle.id)" class="delete-btn">削除</button>
          </li>
        </ul>
        <p v-else>保存されたパズルはありません。</p>
        <button @click="showSavedPuzzles = false" class="close-modal-btn">閉じる</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// ... (script 部分はそのまま。変更なし) ...

import { ref, computed } from "vue";
import type { Cell, SavedPuzzle, SavedCellData, Candidates, Board } from "@/types/sudoku";
import { useSudoku } from "@/composables/useSudoku";
import SudokuCell from "@/components/SudokuCell.vue";
import NumberPicker from "@/components/NumberPicker.vue";
import { makePuzzleByDifficulty } from "@/utils/puzzleGenerator";
import { nextTick, onMounted } from "vue";

// UUID生成のための簡易関数 (本番ではより堅牢なライブラリの使用を推奨)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 型
type Difficulty = "easy" | "medium" | "hard";
type SudokuValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type InputMode = "confirm" | "thinking";

// UI 状態
const inputMode = ref<InputMode>("confirm");
const selectedNumber = ref(0);
const currentDifficulty = ref<Difficulty>("easy");
const errorMessage = ref("");
const selectedCell = ref<Cell | null>(null);
const showSavedPuzzles = ref(false);

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

const savedPuzzles = ref<SavedPuzzle[]>([]);
const LOCAL_STORAGE_KEY = 'sudokuSavedPuzzles';

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

  loadSavedPuzzles();
});

const sortedSavedPuzzles = computed(() => {
  return [...savedPuzzles.value].sort((a, b) => b.timestamp - a.timestamp);
});


function handleKeyDown(event: KeyboardEvent) {
  if (showSavedPuzzles.value) {
    return;
  }

  if (!selectedCell.value) {
    return;
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
      } else if (!selectedCell.value.isGiven && inputMode.value === 'thinking') {
        const currentCandidates = selectedCell.value.userCandidates;
        const candidatesToDelete: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[] = [];
        for (const key in currentCandidates) {
            const candidateNum = parseInt(key) as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9);
            if (currentCandidates[candidateNum]) {
                candidatesToDelete.push(candidateNum);
            }
        }
        
        if (candidatesToDelete.length > 0) {
            candidatesToDelete.forEach(cand => {
                toggleUserCandidate(newRow, newCol, cand);
            });
            event.preventDefault();
        }
      }
      return;
    case '1': case '2': case '3': case '4': case '5':
    case '6': case '7': case '7': case '8': case '9': // 修正: 7が重複しています
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

function toggleInputMode() {
  inputMode.value = inputMode.value === 'confirm' ? 'thinking' : 'confirm';
  errorMessage.value = "";
  console.log(`[App.vue] Input mode toggled to: ${inputMode.value}`);
}

function setInputMode(mode: InputMode) {
  console.log(`[App.vue] Setting input mode to: ${mode}`);
  inputMode.value = mode;
  errorMessage.value = "";
}

function setDifficulty(diff: Difficulty) {
  console.log(`[App.vue] Setting difficulty to: ${diff}`);
  errorMessage.value = "";
  currentDifficulty.value = diff;
}

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

function clearSelection() {
  console.log("[App.vue] clearSelection called.");
  errorMessage.value = "";
  selectedNumber.value = 0;
  selectedCell.value = null;
}

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


// --- LocalStorage 保存/ロード機能 ---

function numbersFromCandidates(candidates: Candidates): (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[] {
  const nums: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[] = [];
  for (let i = 1; i <= 9; i++) {
    if (candidates[i as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)]) {
      nums.push(i as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9));
    }
  }
  return nums;
}

function createCandidatesFromNumbers(numbers: number[]): Candidates {
  const candidates: Candidates = {
    1: false, 2: false, 3: false, 4: false, 5: false,
    6: false, 7: false, 8: false, 9: false
  };
  numbers.forEach(num => {
    if (num >= 1 && num <= 9) {
      candidates[num as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)] = true;
    }
  });
  return candidates;
}


function saveCurrentPuzzle() {
  const puzzleName = prompt("パズル名を入力してください:");
  if (!puzzleName || puzzleName.trim() === "") {
    alert("パズル名が入力されませんでした。保存をキャンセルします。");
    return;
  }

  const boardData: SavedCellData[][] = board.value.map(row =>
    row.map(cell => ({
      value: cell.value,
      isGiven: cell.isGiven,
      userCandidates: numbersFromCandidates(cell.userCandidates),
    }))
  );

  const newSavedPuzzle: SavedPuzzle = {
    id: generateUUID(),
    name: puzzleName.trim(),
    timestamp: Date.now(),
    difficulty: currentDifficulty.value,
    boardData: boardData,
  };

  savedPuzzles.value.push(newSavedPuzzle);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedPuzzles.value));
    alert(`「${newSavedPuzzle.name}」としてパズルを保存しました！`);
    console.log("[App.vue] Puzzle saved:", newSavedPuzzle);
  } catch (e) {
    console.error("Failed to save puzzle to LocalStorage:", e);
    errorMessage.value = "パズルの保存に失敗しました。";
  }
}

function loadSavedPuzzles() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsedData: SavedPuzzle[] = JSON.parse(data);
      parsedData.forEach(savedPuzzle => {
        savedPuzzle.boardData.forEach(row => {
          row.forEach(cellData => {
            if (!Array.isArray(cellData.userCandidates)) {
                cellData.userCandidates = [];
            }
          });
        });
      });
      savedPuzzles.value = parsedData;
      console.log("[App.vue] Saved puzzles loaded:", savedPuzzles.value);
    }
  } catch (e) {
    console.error("Failed to load puzzles from LocalStorage:", e);
    errorMessage.value = "保存されたパズルの読み込みに失敗しました。";
  }
}

function loadPuzzle(id: string) {
  const puzzleToLoad = savedPuzzles.value.find(p => p.id === id);
  if (!puzzleToLoad) {
    errorMessage.value = "指定されたパズルが見つかりません。";
    console.error(`[App.vue] Puzzle with ID ${id} not found.`);
    return;
  }

  console.log(`[App.vue] Loading puzzle: ${puzzleToLoad.name} (${puzzleToLoad.id})`);
  errorMessage.value = "";

  const newGamePuzzle: SudokuValue[][] = Array.from({ length: 9 }, () => Array(9).fill(0) as SudokuValue[]);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzleToLoad.boardData[r][c].isGiven) {
        newGamePuzzle[r][c] = puzzleToLoad.boardData[r][c].value as SudokuValue;
      }
    }
  }

  // useSudokuインスタンスを再初期化する
  // board.valueに直接代入するのではなく、新しいapiインスタンスのboard.valueを使う
  let newUseSudokuApi = useSudoku(newGamePuzzle); // 新しいAPIインスタンスを作成
  board.value = newUseSudokuApi.board.value; // 新しいボードで置き換え
  setCellValue = newUseSudokuApi.setCellValue;
  toggleUserCandidate = newUseSudokuApi.toggleUserCandidate;
  resetBoard = newUseSudokuApi.resetBoard;
  updateAllCandidates = newUseSudokuApi.updateAllCandidates;
  
  // ユーザーが入力した確定値と候補を復元
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const savedCell = puzzleToLoad.boardData[r][c];
      const currentCell = board.value[r][c]; 

      // ユーザーが入力した確定値をセット
      if (savedCell.value !== 0 && !savedCell.isGiven) {
        // 直接 setCellValue を呼ぶと conflicts が発生する可能性があるので、
        // isConflict を回避するために一旦候補を更新する前に値を設定
        board.value[r][c].value = savedCell.value as SudokuValue;
      } else if (savedCell.value === 0 && currentCell.value !== 0 && !currentCell.isGiven) {
         // 元のパズルで確定値だったが、保存時にはユーザーが0にした場合も考慮
         board.value[r][c].value = 0;
      }

      // userCandidates を復元
      // まず既存の候補をクリア
      // (新しいuseSudokuインスタンスで初期化されているので通常は不要だが、念のため)
      for (let i = 1; i <= 9; i++) {
        if (currentCell.userCandidates[i as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)]) {
          currentCell.userCandidates[i as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)] = false;
        }
      }
      // 保存された候補をセット
      savedCell.userCandidates.forEach(candidate => {
        currentCell.userCandidates[candidate as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)] = true;
      });
    }
  }

  // 確定値とユーザー候補をすべてセットし終えてから、自動候補を更新
  updateAllCandidates();

  selectedCell.value = null;
  selectedNumber.value = 0;
  showSavedPuzzles.value = false;

  alert(`「${puzzleToLoad.name}」をロードしました！`);
}

function deletePuzzle(id: string) {
  if (confirm("本当にこのパズルを削除しますか？")) {
    savedPuzzles.value = savedPuzzles.value.filter(p => p.id !== id);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedPuzzles.value));
      alert("パズルを削除しました。");
      console.log(`[App.vue] Puzzle with ID ${id} deleted.`);
    } catch (e) {
      console.error("Failed to delete puzzle from LocalStorage:", e);
      errorMessage.value = "パズルの削除に失敗しました。";
    }
  }
}

// --- /LocalStorage 保存/ロード機能 ---
</script>

<style>
/* App.vue の <style> ブロック全体をこの内容に置き換えてください */
#app {
  max-width: 600px; /* アプリ全体の最大幅 */
  margin: 0 auto;
  padding: 16px;
  text-align: center; /* ボタンなどを中央寄せするため */
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
  width: 432px; /* 9 * 48px = 432px */
  border: 2px solid #007acc;
  margin: 0 auto; /* 中央寄せ */
  box-sizing: content-box; /* paddingとborderをwidthに含めない */
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

/* モーダル関連のスタイル */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin-top: 0;
  color: #333;
}

.modal-content ul {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}

.saved-puzzle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.saved-puzzle-item:last-child {
  border-bottom: none;
}

.saved-puzzle-item span {
  flex-grow: 1;
  text-align: left;
  margin-right: 10px;
  font-size: 0.9rem;
  color: #555;
}

.saved-puzzle-item button {
  padding: 6px 10px;
  margin-left: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007acc;
  color: white;
}

.saved-puzzle-item button.delete-btn {
  background-color: #dc3545;
}

.saved-puzzle-item button:hover {
  opacity: 0.8;
}

.close-modal-btn {
  margin-top: 20px;
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.close-modal-btn:hover {
  background-color: #5a6268;
}
</style>