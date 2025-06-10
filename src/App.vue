<template>
  <div id="app" @keydown="handleKeyDown" tabindex="0">
    <h1>数独 (Sudoku)</h1>

    <!-- モード選択 -->
    <div class="mode-selector">
       <button :class="{ active: gameMode === 'normal' }" @click="exitTrainingMode()">通常モード</button>
       <button :class="{ active: gameMode === 'training' }" @click="gameMode = 'training'">トレーニング</button>
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
    <div v-if="gameMode === 'training'" class="training-buttons">
        <button v-for="tech in trainingPuzzles" :key="tech.key" @click="startTraining(tech)">
            {{ tech.name }}
        </button>
    </div>

    <div class="init-buttons">
       <!-- ★変更: .start-btn クラスを削除 -->
      <button v-if="gameMode === 'normal'" @click="startGame">ゲーム開始</button>
      <!-- トレーニングモードのヒントボタン -->
      <button v-if="gameMode === 'training' && currentTrainingTechnique" @click="showTechniqueHint" class="hint-btn">ヒント表示</button>
      <button v-if="gameMode==='training'" @click="exitTrainingMode()">
        通常モードに戻る
      </button>

      <button @click="clearPuzzle" style="margin-left: 8px">空盤面</button>
      <button @click="resetAll" style="margin-left: 8px">リセット</button>
      <button @click="saveCurrentPuzzle" style="margin-left: 8px">盤面保存</button>
      <button @click="showSavedPuzzles = true" style="margin-left: 8px">盤面保存履歴</button>
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
        :isRelated="isRelatedCell(cell)"
        :highlightType="getHighlightType(cell)"
        :is-training="gameMode === 'training'"  
        :hintRemovalApplied="hintRemovalApplied"
        :removalCandidates="currentTrainingTechnique?.removalCandidates || []"
        @selectCell="onSelectCellFromBoard"
        @inputCell="onInputCell"
        @toggleCandidate="onToggleCandidate"
      />
    </div>

    <!-- 保存されたパズルのモーダル -->
    <div v-if="showSavedPuzzles" class="modal-overlay" @click.self="showSavedPuzzles = false">
      <div class="modal-content">
        <h2>保存されたパズル</h2>
        <ul v-if="savedPuzzles.length > 0">
          <li v-for="puzzle in sortedSavedPuzzles" :key="puzzle.id" class="saved-puzzle-item">
            <span>{{ puzzle.name }} ({{ new Date(puzzle.timestamp).toLocaleString() }}) - {{ puzzle.difficulty }}</span>
            <div>
                <button @click="loadPuzzle(puzzle.id)">ロード</button>
                <button @click="deletePuzzle(puzzle.id)" class="delete-btn">削除</button>
            </div>
          </li>
        </ul>
        <p v-else>保存されたパズルはありません。</p>
        <button @click="showSavedPuzzles = false" class="close-modal-btn">閉じる</button>
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
       left: modalPosition.x + 'px'
     }"
     @mousedown.prevent="onModalMouseDown"
   >
        <h2>{{ currentTrainingTechnique?.name }}</h2>
        <p>{{ currentTrainingTechnique?.description }}</p>
        <button @click="showTechniqueModal = false" class="close-modal-btn">閉じる</button>
   </div>
 </div>
   </div>
 
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import type { Cell, SavedPuzzle, SavedCellData, Candidates, Board } from "@/types/sudoku";
import { useSudoku } from "@/composables/useSudoku";
import SudokuCell from "@/components/SudokuCell.vue";
import NumberPicker from "@/components/NumberPicker.vue";
import { makePuzzleByDifficulty } from "@/utils/puzzleGenerator";
// トレーニング用のデータをインポート
import { trainingPuzzles, type TrainingTechnique } from "@/utils/trainingPuzzles";
import { nextTick, onMounted } from "vue";
import { watch , onBeforeUnmount} from 'vue';

// モーダル位置
const modalPosition = ref({ x: 0, y: 0 });
// ドラッグ中フラグ
const isDragging = ref(false);
// ドラッグ開始時のオフセット
let dragOffset = { x: 0, y: 0 };

// モーダルヘッダを押したとき
function onModalMouseDown(event: MouseEvent) {
  isDragging.value = true;
  dragOffset.x = event.clientX - modalPosition.value.x;
  dragOffset.y = event.clientY - modalPosition.value.y;
}

// マウス移動時
function onMouseMove(event: MouseEvent) {
  if (!isDragging.value) return;
  modalPosition.value.x = event.clientX - dragOffset.x;
  modalPosition.value.y = event.clientY - dragOffset.y;
}

// マウスを離したとき
function onMouseUp() {
  isDragging.value = false;
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
});
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
});

/**
 * CandidateGrid.vue から emit された toggleCandidate を
 * useSudoku の toggleUserCandidate に渡すラッパー
 */
function onToggleCandidate(payload: { row: number; col: number; candidate: 1|2|3|4|5|6|7|8|9 }) {
  toggleUserCandidate(payload.row, payload.col, payload.candidate);
}
// UUID生成のための簡易関数
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 型
type Difficulty = "easy" | "medium" | "hard" ; // trainingを追加
type SudokuValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type InputMode = "confirm" | "thinking";

// --- UI 状態 ---
const inputMode = ref<InputMode>("confirm");
const selectedNumber = ref(0);
const currentDifficulty = ref<Difficulty>("easy");
const errorMessage = ref("");
const selectedCell = ref<Cell | null>(null);
const showSavedPuzzles = ref(false);

// トレーニングモード用の状態
const gameMode = ref<'normal' | 'training'>('normal');
const showTechniqueModal = ref(false);
const currentTrainingTechnique = ref<TrainingTechnique | null>(null);
const highlightedCells = ref<{ row: number; col: number; type: string }[]>([]);

// gameMode が変わったらトレーニング専用ステートだけ切り替え
watch(gameMode, (mode) => {
  if (mode === 'normal') {
    // トレーニング用のハイライトとヒントフラグだけをクリア
    highlightedCells.value = [];
    hintRemovalApplied.value = false;
    showTechniqueModal.value = false;
    // 通常モードのパズルを再生成 or クリア
    // startGame();    // これで currentDifficulty のまま新しい盤面がロードされます
    // もし完全に空盤にしたいなら clearPuzzle() を呼んでください
  }
});
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

// --- ライフサイクル ---
onMounted(() => {
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.focus();
  }
  loadSavedPuzzles();
});

// --- Computed ---
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


// --- メソッド ---

// トレーニングモードを開始
function startTraining(technique: TrainingTechnique) {
    console.log(`[App.vue] Starting training for: ${technique.name}`);
    errorMessage.value = "";
    currentTrainingTechnique.value = technique;
    // currentDifficulty.value = 'training'; // 難易度をtrainingに設定
    gameMode.value = 'training';           // ★★ ここでモードも training に切り替える ★★
    highlightedCells.value = []; // ハイライトをリセット

    // ★★★ ここに1行追加 ★★★
    inputMode.value = 'thinking'; // 自動的に候補入力モードにする！
    // ★★★★★★★★★★★★★★★

    // useSudokuに渡すために型を変換
    const puzzleForSudoku = technique.puzzle.map(row => row.map(cell => cell as SudokuValue));
    gamePuzzle = puzzleForSudoku;

    const api = useSudoku(gamePuzzle);
    board.value = api.board.value;
    setCellValue = api.setCellValue;
    toggleUserCandidate = api.toggleUserCandidate;
    resetBoard = api.resetBoard;
    updateAllCandidates = api.updateAllCandidates;
    updateAllCandidates(); // ここで計算された候補数字が表示されるようになる

    selectedNumber.value = 0;
    selectedCell.value = null;

    showTechniqueModal.value = true; // 解説モーダルを表示
}

// トレーニングモードを終了
function exitTrainingMode() {
  // ① モードを通常に
  gameMode.value = 'normal';
  // ② トレーニング状態をまるごとクリア
  currentTrainingTechnique.value = null;
  highlightedCells.value = [];
  hintRemovalApplied.value = false;
  showTechniqueModal.value = false;
  // ③ 現在の難易度でゲーム再開
  startGame();
}


const hintRemovalApplied = ref(false);
// トレーニングモードでヒントを表示
function showTechniqueHint() {
  if (!currentTrainingTechnique.value) return;
  highlightedCells.value = currentTrainingTechnique.value.highlight;

  if (currentTrainingTechnique.value.removalCandidates) {
    hintRemovalApplied.value = true;
  }
}
// セルのハイライトタイプを取得
function getHighlightType(cell: Cell): string | null {
  // ① まず primary を探す
  const primary = highlightedCells.value.find(
    h => h.row === cell.row && h.col === cell.col && h.type === 'primary'
  );
  if (primary) {
    return 'primary';
  }
  // ② 次に secondary を探す
  const secondary = highlightedCells.value.find(
    h => h.row === cell.row && h.col === cell.col && h.type === 'secondary'
  );
  return secondary ? 'secondary' : null;
}

function handleKeyDown(event: KeyboardEvent) {
  if (showSavedPuzzles.value || showTechniqueModal.value) {
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
    case '6': case '7': case '8': case '9':
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
  if (!selectedCell.value) {
    return false;
  }
  if (cell.row === selectedCell.value.row && cell.col === selectedCell.value.col) {
    return false;
  }

  const selectedRow = selectedCell.value.row;
  const selectedCol = selectedCell.value.col;

  if (cell.row === selectedRow || cell.col === selectedCol) {
    return true;
  }

  const selectedBlockRow = Math.floor(selectedRow / 3);
  const selectedBlockCol = Math.floor(selectedCol / 3);
  const cellBlockRow = Math.floor(cell.row / 3);
  const cellBlockCol = Math.floor(cell.col / 3);

  if (selectedBlockRow === cellBlockRow && selectedBlockCol === cellBlockCol) {
    return true;
  }

  return false;
}


function toggleInputMode() {
  inputMode.value = inputMode.value === 'confirm' ? 'thinking' : 'confirm';
  errorMessage.value = "";
}

function setDifficulty(diff: Difficulty) {
  errorMessage.value = "";
  currentDifficulty.value = diff;
}

function startGame() {
  gameMode.value = 'normal';  
  console.log("[App.vue] Starting new game...");
  errorMessage.value = "";
  currentTrainingTechnique.value = null; // トレーニング状態をリセット
  highlightedCells.value = []; // ハイライトをリセット
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
    selectedCell.value = flatCells.value.length > 0 ? flatCells.value[0] : null;
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.focus();
    }
  });
}

function clearPuzzle() {
  console.log("[App.vue] Clearing puzzle...");
  errorMessage.value = "";
  currentTrainingTechnique.value = null;
  highlightedCells.value = [];
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
    selectedCell.value = flatCells.value.length > 0 ? flatCells.value[0] : null;
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.focus();
    }
  });
}

function resetAll() {
  console.log("[App.vue] Resetting all...");
  errorMessage.value = "";
  highlightedCells.value = []; // ハイライトもリセット
  const api = useSudoku(gamePuzzle as SudokuValue[][]);
  board.value = api.board.value;
  setCellValue = api.setCellValue;
  toggleUserCandidate = api.toggleUserCandidate;
  resetBoard = api.resetBoard;
  updateAllCandidates = api.updateAllCandidates;
  updateAllCandidates();
  selectedNumber.value = 0;
  nextTick(() => {
    selectedCell.value = flatCells.value.length > 0 ? flatCells.value[0] : null;
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.focus();
    }
  });
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
    if (c !== col && board.value[row][c].value === val) return true;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board.value[r][col].value === val) return true;
  }
  const br = Math.floor(row / 3) * 3,
    bc = Math.floor(col / 3) * 3;
  for (let r_block = br; r_block < br + 3; r_block++) {
    for (let c_block = bc; c_block < bc + 3; c_block++) {
      if (
        !(r_block === row && c_block === col) &&
        board.value[r_block][c_block].value === val
      ) {
        return true;
      }
    }
  }
  return false;
}

function onInputCell(payload: { row: number; col: number; val: number }) {
  const { row, col, val } = payload;
  if (!selectedCell.value || selectedCell.value.isGiven) return;
  errorMessage.value = "";
  if (val === 0) {
    setCellValue(row, col, 0);
    updateAllCandidates();
    return;
  }
  if (inputMode.value === "confirm") {
    if (isConflict(row, col, val)) {
      errorMessage.value = `重複: (${row + 1},${col + 1}) に ${val} は置けません`;
      return;
    }
    setCellValue(row, col, val as SudokuValue);
    updateAllCandidates();
  } else {
    toggleUserCandidate(row, col, val as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9);
  }
}

function numbersFromCandidates(candidates: Candidates): (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[] {
  const nums: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[] = [];
  for (let i = 1; i <= 9; i++) {
    if (candidates[i as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)]) {
      nums.push(i as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9));
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
      savedPuzzles.value = parsedData;
    }
  } catch (e) {
    console.error("Failed to load puzzles from LocalStorage:", e);
  }
}

function loadPuzzle(id: string) {
  const puzzleToLoad = savedPuzzles.value.find(p => p.id === id);
  if (!puzzleToLoad) return;
  errorMessage.value = "";

  const newGamePuzzle: SudokuValue[][] = Array.from({ length: 9 }, () => Array(9).fill(0) as SudokuValue[]);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzleToLoad.boardData[r][c].isGiven) {
        newGamePuzzle[r][c] = puzzleToLoad.boardData[r][c].value as SudokuValue;
      }
    }
  }
  const savedTech = trainingPuzzles.find(t => t.name === puzzleToLoad.name);
if (savedTech) {
  // ② トレーニングパズルだった
  currentTrainingTechnique.value = savedTech;
  gameMode.value = 'training';
} else {
  // ③ 通常パズルだった
  currentTrainingTechnique.value = null;
  gameMode.value = 'normal';
}
  highlightedCells.value = [];

  let newUseSudokuApi = useSudoku(newGamePuzzle);
  board.value = newUseSudokuApi.board.value;
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
      } else if (savedCell.value === 0 && currentCell.value !== 0 && !currentCell.isGiven) {
        board.value[r][c].value = 0;
      }
      for (let i = 1; i <= 9; i++) {
        (currentCell.userCandidates as any)[i] = false;
      }
      savedCell.userCandidates.forEach(candidate => {
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
    savedPuzzles.value = savedPuzzles.value.filter(p => p.id !== id);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedPuzzles.value));
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
  max-width: 600px; /* アプリ全体の最大幅 */
  margin: 0 auto;
  padding: 16px;
  text-align: center; /* ボタンなどを中央寄せするため */
  font-family: Arial, sans-serif;
  -webkit-tap-highlight-color: transparent; /* スマホでのタップ時のハイライトを無効化 */
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
  color: #333; /* ボタンの文字色をデフォルトで黒っぽくする */
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

.training-buttons {
    margin-bottom: 12px;
}

.difficulty-buttons,
.init-buttons {
  margin-bottom: 12px;
}
.validation-msg {
  color: red;
  margin: 8px 0;
  min-height: 1.2em; /* エラーメッセージでレイアウトがずれないように */
}

.board-wrapper {
  display: grid;
  grid-template-columns: repeat(9, minmax(30px, 1fr)); /* レスポンシブ対応 */
  grid-template-rows: repeat(9, minmax(30px, 1fr)); /* レスポンシブ対応 */
  max-width: 450px; /* 盤面の最大幅 */
  aspect-ratio: 1 / 1; /* 正方形を維持 */
  border: 2px solid #007acc;
  margin: 16px auto; /* 上下のマージンを調整 */
  box-sizing: content-box;
}

.congrats, .error-msg {
  margin: 12px 0;
  font-size: 1.2rem;
  font-weight: bold;
}
.congrats { color: green; }
.error-msg { color: red; }

/* ★変更: .start-btn関連のスタイルを削除 */

.hint-btn { background-color: #28a745; color: white; border: none; }
.hint-btn:hover { background-color: #218838; }


/* モーダル関連のスタイル */
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
  flex-wrap: wrap; /* レスポンシブ対応 */
}
.saved-puzzle-item span {
  flex-grow: 1;
  text-align: left;
  margin-right: 10px;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 5px; /* レスポンシブ対応 */
}
.saved-puzzle-item div {
    display: flex;
    flex-shrink: 0; /* ボタンが縮まないように */
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
.saved-puzzle-item button.delete-btn { background-color: #dc3545; }
.saved-puzzle-item button:hover { opacity: 0.8; }

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
.close-modal-btn:hover { background-color: #5a6268; }
</style>
