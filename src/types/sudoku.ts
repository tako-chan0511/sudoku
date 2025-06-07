// src/types/sudoku.ts

/** 候補管理用オブジェクト (1〜9 のキーを boolean で持つ) */
export type Candidates = {
  1: boolean
  2: boolean
  3: boolean
  4: boolean
  5: boolean
  6: boolean
  7: boolean
  8: boolean
  9: boolean
}

/**
 * 1 マスを表すインターフェース
 * - value: 0＝空 / 1〜9＝確定数字
 * - isGiven: 初期盤面から与えられた手掛かりなら true（編集不可扱い）
 * - candidates: 自動候補（canPlace 判定による）を保持
 * - userCandidates: ユーザーが手動でオン／オフした候補を保持
 */
export interface Cell {
  row: number
  col: number
  value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  isGiven: boolean
  candidates: Candidates
  userCandidates: Candidates
}

/** Board は 9×9 の Cell[][] */
export type Board = Cell[][]
