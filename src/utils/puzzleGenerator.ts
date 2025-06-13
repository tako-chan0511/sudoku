// src/utils/puzzleGenerator.ts

/** Fisher–Yates による配列シャッフル */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 指定セルに n を置けるか (行・列・ブロック重複チェック) */
function canPlace(bd: number[][], row: number, col: number, n: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (bd[row][i] === n || bd[i][col] === n) return false;
  }
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (bd[r][c] === n) return false;
    }
  }
  return true;
}

/** 解の一意性をチェック（2解目が見つかったら打ち切り） */
function hasUniqueSolution(board: number[][]): boolean {
  let solutionCount = 0;

  function solve(r = 0, c = 0): boolean {
    if (r === 9) {
      solutionCount++;
      return solutionCount < 2;
    }

    const [nr, nc] = c === 8 ? [r + 1, 0] : [r, c + 1];

    if (board[r][c] !== 0) {
      return solve(nr, nc);
    }

    for (let n = 1; n <= 9; n++) {
      if (canPlace(board, r, c, n)) {
        board[r][c] = n;
        const continueSearch = solve(nr, nc);
        board[r][c] = 0;
        if (!continueSearch) return false;
      }
    }
    return true;
  }

  solve();
  return solutionCount === 1;
}

/** 完全解をバックトラックで生成 */
export function generateFullSolution(): number[][] {
  const bd = Array.from({ length: 9 }, () => Array(9).fill(0));

  function backtrack(r = 0, c = 0): boolean {
    if (r === 9) return true;

    const [nr, nc] = c === 8 ? [r + 1, 0] : [r, c + 1];

    for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (canPlace(bd, r, c, n)) {
        bd[r][c] = n;
        if (backtrack(nr, nc)) return true;
        bd[r][c] = 0;
      }
    }
    return false;
  }

  backtrack();
  return bd;
}

/** 与えられ数字を targetGivens 個残すまでランダムにくり抜く（ユニーク解保証付き） */
export function digHoles(solution: number[][], targetGivens: number): number[][] {
  const puzzle = solution.map(row => row.slice());
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let givens = 81;

  for (const pos of positions) {
    if (givens <= targetGivens) break;

    const r = Math.floor(pos / 9);
    const c = pos % 9;

    if (puzzle[r][c] !== 0) {
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;

      if (!hasUniqueSolution(puzzle)) {
        puzzle[r][c] = backup; // 戻す
      } else {
        givens--;
      }
    }
  }

  return puzzle;
}

/** 難易度ごとの「与えられ数字数」を設定して生成 */
export function makePuzzleByDifficulty(diff: 'easy' | 'medium' | 'hard'): number[][] {
  const full = generateFullSolution();
  const target =
    diff === 'easy' ? 36 :
    diff === 'medium' ? 30 :
    24; // hard

  return digHoles(full, target);
}
