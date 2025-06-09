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

// ★追加：InputMode 型をここで定義
export type InputMode = 'confirm' | 'thinking';

// ★追加：保存機能のための型定義

/**
 * 保存されるセルのデータ構造（LocalStorage用）
 * Cellインターフェースから `row` と `col`、`candidates` は除外。
 * `userCandidates` は保存時に配列形式に変換。
 */
export interface SavedCellData {
  value: Cell['value'];
  isGiven: Cell['isGiven'];
  // userCandidates は Candidates オブジェクトから、true のものだけを数値配列として保存
  // ロード時にこの配列から Candidates オブジェクトを再構築する
  userCandidates: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[];
}

/**
 * 保存されるパズルの全体データ構造
 */
export interface SavedPuzzle {
  id: string; // パズルを一意に識別するためのID (UUIDなどを想定)
  name: string; // ユーザーが設定する保存名
  timestamp: number; // 保存日時 (Date.now()で取得し、ソートなどに利用)
  boardData: SavedCellData[][]; // 9x9の盤面データ
  difficulty: "easy" | "medium" | "hard"; // 保存時の難易度
}