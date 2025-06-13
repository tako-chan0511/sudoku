puzzleGenerator.ts は、数独の盤面（完全解・問題）を生成するユーティリティです。Fisher–Yatesによるシャッフル、バックトラック探索、ユニーク解の保証付き穴あけ処理を含みます。

✅ 主な関数の解説
1. shuffle<T>(arr: T[]): T[]
配列をランダムに並び替える（Fisher–Yatesアルゴリズム）

2. canPlace(...)
数字 n を (row, col) に置けるかどうか判定。

行・列・3x3ブロック内の重複をチェック。

3. hasUniqueSolution(board: number[][]): boolean
再帰的なバックトラック解法で、解が2つ以上あるかをチェック。

2解目が見つかり次第 false を返して高速終了。

4. generateFullSolution()
空の9x9ボードに対してバックトラックで数字を埋め、完全な正解盤面（ユニーク）を生成。

数字はランダム順（shuffle使用）で試行。

5. digHoles(solution: number[][], targetGivens: number): number[][]
解をランダムに削除し、指定した targetGivens の数まで「与えられた数字」を減らす。

候補削除のたびに hasUniqueSolution() を呼んでユニーク解であることを保証。

6. makePuzzleByDifficulty(diff: 'easy' | 'medium' | 'hard')
難易度に応じて残す数字数を変えて盤面生成

easy: 36マス残し

medium: 30マス

hard: 24マス

⚠️ 補足と注意点
hasUniqueSolution() の計算は高負荷のため、digHoles() のループは時間がかかる場合があります。

解の検証を入れることで正しい数独問題（1解のみ）を保証できますが、リアルタイム用途では注意が必要です。