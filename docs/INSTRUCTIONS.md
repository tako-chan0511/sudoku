# 数独ゲーム 操作マニュアル

この数独ゲームは、シンプルな操作で直感的に遊べるように設計されています。

---

## 1. ゲームの開始と設定

- **難易度選択**  
  画面上部の「Easy」「Medium」「Hard」ボタンで、パズルの難易度を選べます。

- **ゲーム開始**  
  「ゲーム開始」ボタンをクリックすると、選択した難易度で新しい数独パズルが生成されます。

- **空盤面**  
  「空盤面」ボタンをクリックすると、数字が一切入っていないまっさらな数独ボードになります。

- **リセット**  
  「リセット」ボタンをクリックすると、現在の盤面が、ゲーム開始時の初期状態（問題の数字が埋まっている状態）に戻ります。

---

## 2. 数字の入力モード

このゲームには、数字を確定する「確定モード」と、候補をメモする「思考モード」の2つの入力モードがあります。画面上部のボタンで切り替えます。

- **確定モード（デフォルト）**  
  セルの確定値を入力するモードです。  
  ルールに違反する数字（行、列、3x3ブロック内で重複する数字）は入力できません。

- **思考モード**  
  セルの候補（メモ）を入力するモードです。  
  入力した数字は小さく、セル内の特定の場所に表示されます。  
  このモードでは、数独のルール違反チェックは行われません。（あくまでメモなので、自由に入力できます）

---

## 3. 数字の入力方法

1. **セルを選択する**  
   まず、数字を入力したい盤面上の空いているセルをクリックします。  
   選択されたセルは、青い枠線で強調表示されます。  
   すでに確定値が入っているセルも選択できますが、問題の数字（薄いグレーの背景のセル）は変更できません。

2. **数字を選ぶ**  
   画面下部の「ナンバーピッカー」で、入力したい数字（1〜9）をクリックします。

3. **入力結果**  
   - **確定モードの場合**  
     選んだ数字がセルの中央に大きく表示されます。  
     ルール違反の場合はエラーメッセージが表示され、入力は拒否されます。  
     すでに数字が入っているセルも、新しい数字で上書きしたり、0（「×」ボタン）でクリアしたりできます。

   - **思考モードの場合**  
     選んだ数字が、セル内の小さなグリッドの対応する位置に小さく表示されます（例: 1なら左上、5なら中央、9なら右下）。  
     同じ数字を再度選ぶと、その候補は消えます（トグル）。  
     複数の候補を同時に表示できます。

---

## 4. セルのクリアと選択解除

- **セルをクリアする**  
  セルを選択し、ナンバーピッカーの「×」（0）ボタンをクリックします。  
  確定モードでも思考モードでも、セルの確定値や候補がすべてクリアされます。

- **セルの選択を解除する**  
  選択中のセルをもう一度クリックするか、画面下部の「選択中の数字」エリア（※この表示は現在非表示になっていますが、今後「選択解除」ボタンで解除可能になる予定です）をクリックします。

---

## 5. エラーメッセージと完成判定

- **エラーメッセージ**  
  確定モードでルールに違反する数字を入力した場合、画面に赤いエラーメッセージが表示されます。

- **完成メッセージ**  
  全てのセルが正しく埋まると、「Congratulations!!!」のメッセージが表示されます。  
  全てのセルが埋まっているのに間違いがある場合は、赤いエラーメッセージが表示されます。