<template>
  <div id="app" @keydown="handleKeyDown" tabindex="0">
    <h1>数独 (Sudoku)</h1>

    <!-- モード選択 -->
    <div class="mode-selector">
      <button
        :class="{ active: gameMode === 'normal' }"
        @click="exitTrainingMode()"
      >
        通常モード
      </button>
      <button
        :class="{ active: gameMode === 'training' }"
        v-if="gameMode === 'normal'"
        @click="
          confirmAndRun(
            '編集中の内容を破棄してトレーニングモードに入りますか？',
            setTrainingMode
          )
        "
        style="margin-left: 8px"
      >
        トレーニング
      </button>
    </div>

    <!-- 通常モード用の難易度選択 -->
    <div v-if="gameMode === 'normal'" class="difficulty-buttons">
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

    <!-- トレーニングモード用のテクニック選択 -->
    <div v-if="gameMode === 'training'" class="training-select">
      <div v-if="trainingBanner" class="training-banner">
        {{ trainingBanner }}
      </div>
      <select v-model="selectedTechniqueKey" @change="onSelectTechnique">
        <option disabled value="">テクニックを選択してください</option>
        <option
          v-for="tech in trainingPuzzles"
          :key="tech.key"
          :value="tech.key"
        >
          {{ tech.name }}
        </option>
      </select>
    </div>

    <div class="init-buttons">
      <!-- ★★★ 修正点: 開始ボタンのグループ化とアクティブクラスの適用 ★★★ -->
      <div class="start-group" v-if="gameMode === 'normal'">
        <button
          @click="startGame"
          :class="{ active: activeStartMode === 'normal' }"
        >
          ゲーム開始
        </button>
        <button
          @click="startGameWithSupport"
          :class="{ active: activeStartMode === 'support' }"
        >
          サポート付き
        </button>
      </div>

      <button
        v-if="gameMode === 'training' && currentTrainingTechnique"
        @click="showTechniqueHint"
        class="hint-btn"
      >
        {{ showTechniqueModal ? "説明表示" : "ヒント表示" }}
      </button>

      <button
        v-if="gameMode === 'normal'"
        @click="
          confirmAndRun('編集中の内容を破棄して空の盤面にしますか？', () =>
            clearPuzzle(true)
          )"
        style="margin-left: 8px"
      >
        空盤面
      </button>
      <button
        v-if="gameMode === 'normal'"
        @click="confirmAndRun('編集内容を破棄してリセットしますか？', resetAll)"
        style="margin-left: 8px"
      >
        リセット
      </button>
      <button @click="saveCurrentPuzzle" style="margin-left: 8px">
        盤面保存
      </button>
      <button
        v-if="gameMode === 'normal'"
        @click="showSavedPuzzles = true"
        style="margin-left: 8px"
      >
        盤面保存履歴
      </button>
    </div>
    <div class="input-mode-buttons">
      <button
        v-if="gameMode === 'normal'"
        :class="{ active: inputMode === 'thinking' }"
        @click="toggleInputMode"
      >
        候補入力モード
      </button>
    </div>
    <NumberPicker v-if="gameMode === 'normal'" @pick="onNumberPicked" />
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
          selectedCell?.row === cell.row && selectedCell?.col === cell.col
        "
        :isRelated="isRelatedCell(cell)"
        :highlight-type="getHighlightType(cell)"
        :is-training="gameMode === 'training'"
        :hint-removal-applied="hintRemovalApplied"
        :removal-candidates="currentTrainingTechnique?.removalCandidates || []"
        @selectCell="onSelectCellFromBoard"
        @toggleCandidate="handleToggleCandidate"
      />
    </div>

    <!-- 保存されたパズルのモーダル -->
    <div
      v-if="showSavedPuzzles"
      class="modal-overlay"
      @click.self="showSavedPuzzles = false"
    >
      <div class="modal-content">
        <h2>保存されたパズル</h2>
        <ul v-if="sortedSavedPuzzles.length > 0">
          <li
            v-for="puzzle in sortedSavedPuzzles"
            :key="puzzle.id"
            class="saved-puzzle-item"
          >
            <span
              >{{ puzzle.name }} ({{
                new Date(puzzle.timestamp).toLocaleString()
              }}) - {{ puzzle.difficulty }}</span
            >
            <div>
              <button @click="loadPuzzle(puzzle.id)">ロード</button>
              <button @click="deletePuzzle(puzzle.id)" class="delete-btn">
                削除
              </button>
            </div>
          </li>
        </ul>
        <p v-else>保存されたパズルはありません。</p>
        <button @click="showSavedPuzzles = false" class="close-modal-btn">
          閉じる
        </button>
      </div>
    </div>

    <!-- テクニック解説モーダル -->
    <div
      v-if="showTechniqueModal"
      class="modal-overlay"
      @click.self="showTechniqueModal = false"
    >
      <div
        class="modal-content"
        :style="{
          position: 'absolute',
          top: modalPosition.y + 'px',
          left: modalPosition.x + 'px',
        }"
        @mousedown.prevent="onModalMouseDown"
      >
        <h2>{{ currentTrainingTechnique?.name }}</h2>
        <p>{{ currentTrainingTechnique?.description }}</p>
        <button @click="showTechniqueModal = false" class="close-modal-btn">
          閉じる
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import type {
  Cell,
  SavedPuzzle,
  SavedCellData,
  Candidates,
  Board,
  SudokuValue,
  CandidateNumber,
} from "@/types/sudoku";
import { useSudoku } from "@/composables/useSudoku";
import SudokuCell from "@/components/SudokuCell.vue";
import NumberPicker from "@/components/NumberPicker.vue";
import { makePuzzleByDifficulty } from "@/utils/puzzleGenerator";
import {
  trainingPuzzles,
  type TrainingTechnique,
} from "@/utils/trainingPuzzles";
import { nextTick, onMounted, onBeforeUnmount, watch } from "vue";

// --- Type Definitions ---
type Difficulty = "easy" | "medium" | "hard";

// --- State & Refs ---
const inputMode = ref<"confirm" | "thinking">("confirm");
const selectedNumber = ref(0);
const currentDifficulty = ref<Difficulty>("easy");
const errorMessage = ref("");
const selectedCell = ref<Cell | null>(null);
const showSavedPuzzles = ref(false);
const gameMode = ref<"normal" | "training">("normal");
const showTechniqueModal = ref(false);
const currentTrainingTechnique = ref<TrainingTechnique | null>(null);
const highlightedCells = ref<{ row: number; col: number; type: string }[]>([]);
const trainingBanner = ref<string | null>(null);
const selectedTechniqueKey = ref<string>("");
const hintRemovalApplied = ref(false);
const savedPuzzles = ref<SavedPuzzle[]>([]);
const LOCAL_STORAGE_KEY = "sudokuSavedPuzzles";
const modalPosition = ref({ x: 0, y: 0 });
const isDragging = ref(false);
let dragOffset = { x: 0, y: 0 };

// ★★★ 開始モードの状態を管理する新しいRef ★★★
const activeStartMode = ref<"normal" | "support">("normal");

let gamePuzzle: SudokuValue[][] = Array.from({ length: 9 }, () =>
  Array(9).fill(0)
);
let {
  board,
  flatCells,
  setCellValue,
  toggleUserCandidate,
  resetBoard,
  updateAllCandidates,
} = useSudoku(gamePuzzle);

const isModified = ref(false);
// DevTools にも見えるように明示的に公開
// defineExpose({ isModified });


function confirmAndRun(message: string, fn: () => void) {
  console.log("⏰ confirmAndRun invoked, isModified =", isModified.value);
  if (!isModified.value) {
    console.log(' → 未編集扱いなので即実行');
    fn();
    isModified.value = false;
  } else {
    console.log(' → 編集あり、confirm表示');
    if (window.confirm(message)) {
      console.log(' → ユーザーOK');
      fn();
      isModified.value = false;
    } else {
      console.log(' → ユーザーCancel');
    }
  }
}


// --- Computed Properties ---
const sortedSavedPuzzles = computed(() => {
  return [...savedPuzzles.value].sort((a, b) => b.timestamp - a.timestamp);
});
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

// --- Watchers ---
watch(gameMode, (mode) => {
  if (mode === "normal") {
    highlightedCells.value = [];
    hintRemovalApplied.value = false;
    showTechniqueModal.value = false;
  }
});

// --- Lifecycle Hooks ---
onMounted(() => {
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  loadSavedPuzzles();
});
onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
});

// --- Methods ---

// Modal Dragging
function onModalMouseDown(event: MouseEvent) {
  isDragging.value = true;
  dragOffset.x = event.clientX - modalPosition.value.x;
  dragOffset.y = event.clientY - modalPosition.value.y;
}
function onMouseMove(event: MouseEvent) {
  if (!isDragging.value) return;
  modalPosition.value.x = event.clientX - dragOffset.x;
  modalPosition.value.y = event.clientY - dragOffset.y;
}
function onMouseUp() {
  isDragging.value = false;
}

// Sudoku Logic
function handleToggleCandidate(payload: {
  row: number;
  col: number;
  candidate: CandidateNumber;
}) {
  if (inputMode.value !== "thinking") return;
  isModified.value = true; // ← 追加
  const { row, col, candidate } = payload;
  if (
    !selectedCell.value ||
    selectedCell.value.row !== row ||
    selectedCell.value.col !== col
  ) {
    const cell = flatCells.value.find((c) => c.row === row && c.col === col);
    if (cell) {
      selectedCell.value = cell;
    }
    return;
  }
  toggleUserCandidate(row, col, candidate);
}

function setTrainingMode() {
  gameMode.value = "training";
  currentTrainingTechnique.value = null;
  trainingBanner.value = null;
  selectedCell.value = null;
  highlightedCells.value = [];
  clearPuzzle(false);
}

function startTraining(technique: TrainingTechnique) {
  errorMessage.value = "";
  currentTrainingTechnique.value = technique;
  highlightedCells.value = [];
  inputMode.value = "thinking";
  hintRemovalApplied.value = false;

  const puzzleForSudoku = technique.puzzle.map((row) =>
    row.map((cell) => cell as SudokuValue)
  );
  gamePuzzle = puzzleForSudoku;

  const api = useSudoku(gamePuzzle);
  board.value = api.board.value;
  flatCells = api.flatCells;
  setCellValue = api.setCellValue;
  toggleUserCandidate = api.toggleUserCandidate;
  resetBoard = api.resetBoard;
  updateAllCandidates = api.updateAllCandidates;

  selectedNumber.value = 0;
  selectedCell.value = null;
  showTechniqueModal.value = true;
  trainingBanner.value = `🎓 トレーニングモード：${technique.name}`;
}

function onSelectTechnique() {
  const key = selectedTechniqueKey.value;
  const tech = trainingPuzzles.find((t) => t.key === key);
  if (tech) {
    startTraining(tech);
    selectedTechniqueKey.value = "";
  }
}

function exitTrainingMode() {
  gameMode.value = "normal";
  currentTrainingTechnique.value = null;
  trainingBanner.value = null;
  highlightedCells.value = [];
  hintRemovalApplied.value = false;
  showTechniqueModal.value = false;
  startGame();
}

function showTechniqueHint() {
  if (!currentTrainingTechnique.value) return;
  highlightedCells.value = currentTrainingTechnique.value.highlight;
  if (currentTrainingTechnique.value.removalCandidates) {
    hintRemovalApplied.value = true;
  }
}

function getHighlightType(cell: Cell): string | null {
  const primary = highlightedCells.value.find(
    (h) => h.row === cell.row && h.col === cell.col && h.type === "primary"
  );
  if (primary) return "primary";
  const secondary = highlightedCells.value.find(
    (h) => h.row === cell.row && h.col === cell.col && h.type === "secondary"
  );
  return secondary ? "secondary" : null;
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === " " || event.key === "Spacebar") {
    event.preventDefault();
    event.stopPropagation();
    if (gameMode.value === "normal") {
      toggleInputMode();
    }
    return;
  }

  if (showSavedPuzzles.value || showTechniqueModal.value) return;
  if (!selectedCell.value) return;

  let newRow = selectedCell.value.row,
    newCol = selectedCell.value.col,
    moved = false;
  switch (event.key) {
    case "ArrowUp":
      newRow = Math.max(0, newRow - 1);
      moved = true;
      break;
    case "ArrowDown":
      newRow = Math.min(8, newRow + 1);
      moved = true;
      break;
    case "ArrowLeft":
      newCol = Math.max(0, newCol - 1);
      moved = true;
      break;
    case "ArrowRight":
      newCol = Math.min(8, newCol + 1);
      moved = true;
      break;
    case "Backspace":
    case "Delete":
      if (!selectedCell.value.isGiven && selectedCell.value.value !== 0) {
        onInputCell({ row: newRow, col: newCol, val: 0 });
        event.preventDefault();
      } else if (
        !selectedCell.value.isGiven &&
        inputMode.value === "thinking"
      ) {
        const cands = Object.keys(selectedCell.value.userCandidates)
          .filter(
            (k) =>
              selectedCell.value!.userCandidates[
                k as unknown as CandidateNumber
              ]
          )
          .map((k) => parseInt(k) as CandidateNumber);
        if (cands.length > 0) {
          cands.forEach((cand) => toggleUserCandidate(newRow, newCol, cand));
          event.preventDefault();
        }
      }
      return;
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      onNumberPicked(parseInt(event.key));
      event.preventDefault();
      return;
  }
  if (moved) {
    selectedCell.value = board.value[newRow][newCol];
    event.preventDefault();
  }
}

function isRelatedCell(cell: Cell): boolean {
  if (gameMode.value === "training" || !selectedCell.value) return false;
  if (
    cell.row === selectedCell.value.row &&
    cell.col === selectedCell.value.col
  )
    return false;
  const { row: selRow, col: selCol } = selectedCell.value;
  if (cell.row === selRow || cell.col === selCol) return true;
  return (
    Math.floor(cell.row / 3) === Math.floor(selRow / 3) &&
    Math.floor(cell.col / 3) === Math.floor(selCol / 3)
  );
}

function toggleInputMode() {
  inputMode.value = inputMode.value === "confirm" ? "thinking" : "confirm";
}

function setDifficulty(diff: Difficulty) {
  errorMessage.value = "";
  currentDifficulty.value = diff;
}

function startGame() {
  activeStartMode.value = "normal"; // ★★★ 状態を更新
  gameMode.value = "normal";
  errorMessage.value = "";
  currentTrainingTechnique.value = null;
  highlightedCells.value = [];
  gamePuzzle = makePuzzleByDifficulty(
    currentDifficulty.value
  ) as SudokuValue[][];

  const api = useSudoku(gamePuzzle);
  board.value = api.board.value;
  flatCells = api.flatCells;
  setCellValue = api.setCellValue;
  toggleUserCandidate = api.toggleUserCandidate;
  resetBoard = api.resetBoard;
  updateAllCandidates = api.updateAllCandidates;

  selectedNumber.value = 0;
  nextTick(() => {
    selectedCell.value = flatCells.value.length > 0 ? flatCells.value[0] : null;
  });
  isModified.value = false;
}

// ★★★ 新機能のための関数 ★★★
function startGameWithSupport() {
  activeStartMode.value = "support"; // ★★★ 状態を更新
  startGame(); // まず通常のゲーム開始処理を呼び出す

  // ゲーム開始処理が終わった後で候補を表示する
  nextTick(() => {
    inputMode.value = "thinking"; // 候補入力モードに切り替え
    flatCells.value.forEach((cell) => {
      if (cell.value === 0) {
        Object.entries(cell.candidates).forEach(([num, isPossible]) => {
          if (isPossible) {
            toggleUserCandidate(
              cell.row,
              cell.col,
              parseInt(num) as CandidateNumber
            );
          }
        });
      }
    });
  });
  isModified.value = false;
}

function clearPuzzle(selectDefaultCell: boolean = true) {
  activeStartMode.value = "normal"; // ★★★ 状態を更新
  errorMessage.value = "";
  gamePuzzle = Array.from(
    { length: 9 },
    () => Array(9).fill(0) as SudokuValue[]
  );
  const api = useSudoku(gamePuzzle);
  board.value = api.board.value;
  flatCells = api.flatCells;
  setCellValue = api.setCellValue;
  toggleUserCandidate = api.toggleUserCandidate;
  resetBoard = api.resetBoard;
  updateAllCandidates = api.updateAllCandidates;

  selectedNumber.value = 0;
  if (selectDefaultCell) {
    nextTick(() => {
      selectedCell.value =
        flatCells.value.length > 0 ? flatCells.value[0] : null;
    });
  }
  isModified.value = false;
}

function resetAll() {
  errorMessage.value = "";
  highlightedCells.value = [];
  const api = useSudoku(gamePuzzle as SudokuValue[][]);
  board.value = api.board.value;
  flatCells = api.flatCells;
  setCellValue = api.setCellValue;
  toggleUserCandidate = api.toggleUserCandidate;
  resetBoard = api.resetBoard;
  updateAllCandidates = api.updateAllCandidates;

  selectedNumber.value = 0;
  nextTick(() => {
    selectedCell.value = flatCells.value.length > 0 ? flatCells.value[0] : null;
  });
  isModified.value = false;
}

function onNumberPicked(n: number) {
  errorMessage.value = "";
  selectedNumber.value = n;
  if (selectedCell.value) {
    if (selectedCell.value.isGiven) {
      errorMessage.value = `問題の数字は変更できません`;
      return;
    }
    onInputCell({
      row: selectedCell.value.row,
      col: selectedCell.value.col,
      val: selectedNumber.value,
    });
  } else {
    errorMessage.value = `先にセルを選択してください。`;
  }
}

function onSelectCellFromBoard(cell: Cell) {
  errorMessage.value = "";
  if (
    selectedCell.value &&
    selectedCell.value.row === cell.row &&
    selectedCell.value.col === cell.col
  ) {
    selectedCell.value = null;
  } else {
    selectedCell.value = cell;
  }
}

function isConflict(row: number, col: number, val: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && board.value[row][c].value === val) {
      return true;
    }
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board.value[r][col].value === val) {
      return true;
    }
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r_block = br; r_block < br + 3; r_block++) {
    for (let c_block = bc; c_block < bc + 3; c_block++) {
      if (
        (r_block !== row || c_block !== col) &&
        board.value[r_block][c_block].value === val
      ) {
        return true;
      }
    }
  }
  return false;
}

function onInputCell({
  row,
  col,
  val,
}: {
  row: number;
  col: number;
  val: number;
}) {
  if (!selectedCell.value || selectedCell.value.isGiven) return;
  console.log('onInputCell:', row, col, val);
  isModified.value = true; // ← ここで必ず立てる
  console.log('→ isModified after set →', isModified.value);  // 追加
  errorMessage.value = "";
  if (val === 0) {
    setCellValue(row, col, 0);
    return;
  }
  if (inputMode.value === "confirm") {
    if (isConflict(row, col, val)) {
      errorMessage.value = `重複: (${row + 1},${
        col + 1
      }) に ${val} は置けません`;
      return;
    }
    setCellValue(row, col, val as SudokuValue);
  } else {
    toggleUserCandidate(row, col, val as CandidateNumber);
  }
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function numbersFromCandidates(candidates: Candidates): CandidateNumber[] {
  const nums: CandidateNumber[] = [];
  for (let i = 1; i <= 9; i++) {
    if (candidates[i as CandidateNumber]) {
      nums.push(i as CandidateNumber);
    }
  }
  return nums;
}

function saveCurrentPuzzle() {
  const puzzleName = prompt("パズル名を入力してください:");
  if (!puzzleName || puzzleName.trim() === "") {
    alert("パズル名が入力されませんでした。保存をキャンセルします。");
    return;
  }
  const boardData: SavedCellData[][] = board.value.map((row) =>
    row.map((cell) => ({
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
  } catch (e) {
    console.error("Failed to save puzzle to LocalStorage:", e);
    errorMessage.value = "パズルの保存に失敗しました。";
  }
}

function loadSavedPuzzles() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      savedPuzzles.value = JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load puzzles from LocalStorage:", e);
  }
}

function loadPuzzle(id: string) {
  const puzzleToLoad = savedPuzzles.value.find((p) => p.id === id);
  if (!puzzleToLoad) return;
  errorMessage.value = "";

  const newGamePuzzle: SudokuValue[][] = Array.from(
    { length: 9 },
    () => Array(9).fill(0) as SudokuValue[]
  );
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzleToLoad.boardData[r][c].isGiven) {
        newGamePuzzle[r][c] = puzzleToLoad.boardData[r][c].value as SudokuValue;
      }
    }
  }

  const savedTech = trainingPuzzles.find((t) => t.name === puzzleToLoad.name);
  if (savedTech) {
    currentTrainingTechnique.value = savedTech;
    gameMode.value = "training";
  } else {
    currentTrainingTechnique.value = null;
    gameMode.value = "normal";
  }
  highlightedCells.value = [];

  let newUseSudokuApi = useSudoku(newGamePuzzle);
  board.value = newUseSudokuApi.board.value;
  flatCells = newUseSudokuApi.flatCells;
  setCellValue = newUseSudokuApi.setCellValue;
  toggleUserCandidate = newUseSudokuApi.toggleUserCandidate;
  resetBoard = newUseSudokuApi.resetBoard;
  updateAllCandidates = newUseSudokuApi.updateAllCandidates;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const savedCell = puzzleToLoad.boardData[r][c];
      const currentCell = board.value[r][c];
      if (savedCell.value !== 0 && !savedCell.isGiven) {
        board.value[r][c].value = savedCell.value as SudokuValue;
      } else if (
        savedCell.value === 0 &&
        currentCell.value !== 0 &&
        !currentCell.isGiven
      ) {
        board.value[r][c].value = 0;
      }
      for (let i = 1; i <= 9; i++) {
        (currentCell.userCandidates as any)[i] = false;
      }
      savedCell.userCandidates.forEach((candidate) => {
        (currentCell.userCandidates as any)[candidate] = true;
      });
    }
  }
  updateAllCandidates();
  selectedCell.value = null;
  selectedNumber.value = 0;
  showSavedPuzzles.value = false;
  alert(`「${puzzleToLoad.name}」をロードしました！`);
}

function deletePuzzle(id: string) {
  if (confirm("本当にこのパズルを削除しますか？")) {
    savedPuzzles.value = savedPuzzles.value.filter((p) => p.id !== id);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(savedPuzzles.value)
      );
      alert("パズルを削除しました。");
    } catch (e) {
      console.error("Failed to delete puzzle from LocalStorage:", e);
      errorMessage.value = "パズルの削除に失敗しました。";
    }
  }
}
</script>

<style>
#app {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  text-align: center;
  font-family: Arial, sans-serif;
  -webkit-tap-highlight-color: transparent;
}
.mode-selector {
  margin-bottom: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  display: inline-flex;
  overflow: hidden;
}
.mode-selector button {
  padding: 8px 16px;
  border: none;
  background-color: #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}
.mode-selector button:first-child {
  border-right: 1px solid #ccc;
}
.mode-selector button.active {
  background-color: #007acc;
  color: white;
}
.input-mode-buttons button,
.difficulty-buttons button,
.init-buttons button,
.training-buttons button {
  padding: 6px 12px;
  margin: 4px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  color: #333;
}
.init-buttons button:first-child {
  background-color: #007acc;
  color: white;
  border-color: #007acc;
}
.init-buttons button:first-child:hover {
  background-color: #005a9c;
}
.input-mode-buttons button.active,
.difficulty-buttons button.active {
  background-color: #007acc;
  color: #fff;
  border-color: #007acc;
}
.difficulty-buttons,
.init-buttons {
  margin-bottom: 12px;
}
.validation-msg {
  color: red;
  margin: 8px 0;
  min-height: 1.2em;
}
.board-wrapper {
  display: grid;
  grid-template-columns: repeat(9, minmax(30px, 1fr));
  grid-template-rows: repeat(9, minmax(30px, 1fr));
  max-width: 450px;
  aspect-ratio: 1 / 1;
  border: 2px solid #007acc;
  margin: 16px auto;
  box-sizing: content-box;
  touch-action: none;
  -webkit-touch-callout: none;
  -ms-touch-action: none;
  user-select: none;
}
.congrats,
.error-msg {
  margin: 12px 0;
  font-size: 1.2rem;
  font-weight: bold;
}
.congrats {
  color: green;
}
.error-msg {
  color: red;
}
.hint-btn {
  background-color: #28a745;
  color: white;
  border: none;
}
.hint-btn:hover {
  background-color: #218838;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  text-align: left;
}
.modal-content h2 {
  margin-top: 0;
  color: #333;
}
.modal-content p {
  line-height: 1.6;
  color: #555;
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
  padding: 12px 5px;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
}
.saved-puzzle-item span {
  flex-grow: 1;
  text-align: left;
  margin-right: 10px;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 5px;
}
.saved-puzzle-item div {
  display: flex;
  flex-shrink: 0;
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
  display: block;
  margin: 20px auto 0;
  padding: 8px 24px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.close-modal-btn:hover {
  background-color: #5a6268;
}
.training-banner {
  background: #007acc;
  color: white;
  padding: 6px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-weight: bold;
}
.training-select select {
  padding: 6px;
  font-size: 1rem;
}
/* ★★★ 開始ボタン用の新しいスタイル ★★★ */
.start-group {
  display: inline-flex;
  border-radius: 4px;
  overflow: hidden;
  vertical-align: middle;
  margin: 4px;
}
.start-group button {
  margin: 0;
  border: 1px solid #007acc;
  background-color: #f0f0f0;
  color: #333;
  border-right-width: 0;
  border-radius: 0;
}
.start-group button:last-child {
  border-right-width: 1px;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}
.start-group button:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}
.start-group button.active {
  background-color: #007acc;
  color: #fff;
  border-color: #007acc;
}
</style>
